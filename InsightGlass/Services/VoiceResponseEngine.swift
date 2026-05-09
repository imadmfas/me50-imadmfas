import Foundation
import AVFoundation

final class VoiceResponseEngine: NSObject, ObservableObject {
    @Published private(set) var isSpeaking: Bool = false

    private let synthesizer = AVSpeechSynthesizer()
    private var pendingQueue: [String] = []

    override init() {
        super.init()
        synthesizer.delegate = self
    }

    // MARK: - Public API

    func speak(_ text: String, mode: ResponseMode) {
        switch mode {
        case .silent:
            return
        case .short:
            let shortened = shortenObservation(text)
            enqueue(shortened)
        case .detailed:
            enqueue(text)
        }
    }

    func speakObservations(_ observations: [EmotionObservation], mode: ResponseMode) {
        guard mode != .silent else { return }
        let selected: [EmotionObservation]
        switch mode {
        case .short:
            selected = Array(observations.sorted { $0.confidenceLevel > $1.confidenceLevel }.prefix(2))
        case .detailed:
            selected = observations.sorted { $0.confidenceLevel > $1.confidenceLevel }
        case .silent:
            return
        }
        selected.map(\.observationText).forEach { speak($0, mode: mode) }
    }

    func stopSpeaking() {
        synthesizer.stopSpeaking(at: .immediate)
        pendingQueue.removeAll()
        isSpeaking = false
    }

    // MARK: - Internals

    private func enqueue(_ text: String) {
        pendingQueue.append(text)
        if !synthesizer.isSpeaking { speakNext() }
    }

    private func speakNext() {
        guard !pendingQueue.isEmpty else {
            isSpeaking = false
            return
        }
        let text = pendingQueue.removeFirst()
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = preferredVoice()
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.92
        utterance.pitchMultiplier = 1.05
        utterance.volume = 0.9
        utterance.preUtteranceDelay = 0.15
        isSpeaking = true
        synthesizer.speak(utterance)
    }

    private func preferredVoice() -> AVSpeechSynthesisVoice? {
        // Prefer a high-quality Siri-style voice when available
        let preferred = ["com.apple.ttsbundle.siri_female_en-US_compact",
                         "com.apple.voice.enhanced.en-US.Samantha",
                         "com.apple.ttsbundle.Samantha-compact"]
        for id in preferred {
            if let voice = AVSpeechSynthesisVoice(identifier: id) { return voice }
        }
        return AVSpeechSynthesisVoice(language: "en-US")
    }

    private func shortenObservation(_ text: String) -> String {
        // Return first clause (up to first period, comma, or dash)
        let delimiters = CharacterSet(charactersIn: ".—–")
        if let range = text.rangeOfCharacter(from: delimiters) {
            return String(text[text.startIndex..<range.lowerBound]) + "."
        }
        return text
    }
}

extension VoiceResponseEngine: AVSpeechSynthesizerDelegate {
    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer,
                           didFinish utterance: AVSpeechUtterance) {
        speakNext()
    }
}
