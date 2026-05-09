import Foundation
import AVFoundation
import Combine

final class AudioPatternAnalyzer: NSObject, ObservableObject {
    @Published private(set) var currentPattern: AudioPattern?
    @Published private(set) var waveformLevels: [Float] = Array(repeating: 0, count: 40)
    @Published private(set) var isListening: Bool = false

    private var audioEngine: AVAudioEngine?
    private var inputNode: AVAudioInputNode?
    private var analysisTimer: Timer?

    // Rolling buffer of dB readings used for trend analysis
    private var decibelHistory: [Float] = []
    private var silenceFrameCount: Int = 0
    private var speechFrameCount: Int = 0
    private let sessionID: UUID

    init(sessionID: UUID) {
        self.sessionID = sessionID
    }

    // MARK: - Lifecycle

    func startListening() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playAndRecord, mode: .measurement,
                                    options: [.defaultToSpeaker, .allowBluetooth])
            try session.setActive(true)
        } catch {
            return
        }

        let engine = AVAudioEngine()
        let input  = engine.inputNode
        let format = input.outputFormat(forBus: 0)

        input.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
            self?.processBuffer(buffer)
        }

        do {
            try engine.start()
            audioEngine = engine
            inputNode = input
            isListening = true
            startAnalysisTimer()
        } catch {
            return
        }
    }

    func stopListening() {
        analysisTimer?.invalidate()
        analysisTimer = nil
        inputNode?.removeTap(onBus: 0)
        audioEngine?.stop()
        audioEngine = nil
        isListening = false
        decibelHistory.removeAll()
        silenceFrameCount = 0
        speechFrameCount  = 0
    }

    // MARK: - Audio processing

    private func processBuffer(_ buffer: AVAudioPCMBuffer) {
        guard let channelData = buffer.floatChannelData?[0] else { return }
        let frameLength = Int(buffer.frameLength)
        guard frameLength > 0 else { return }

        var rms: Float = 0
        for i in 0..<frameLength { rms += channelData[i] * channelData[i] }
        rms = sqrt(rms / Float(frameLength))
        let db = 20 * log10(max(rms, 1e-9))

        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.decibelHistory.append(db)
            if self.decibelHistory.count > 120 { self.decibelHistory.removeFirst() }

            let normalized = max(0, min(1, (db + 60) / 60))
            self.waveformLevels.removeFirst()
            self.waveformLevels.append(normalized)

            if db > -40 { self.speechFrameCount += 1 }
            else        { self.silenceFrameCount += 1 }
        }
    }

    private func startAnalysisTimer() {
        analysisTimer = Timer.scheduledTimer(withTimeInterval: 3.0, repeats: true) { [weak self] _ in
            self?.producePattern()
        }
    }

    private func producePattern() {
        guard !decibelHistory.isEmpty else { return }

        let avgDb = decibelHistory.reduce(0, +) / Float(decibelHistory.count)
        let intensity = Double(max(0, min(1, (avgDb + 60) / 60)))

        let totalFrames = speechFrameCount + silenceFrameCount
        let silenceRatio = totalFrames > 0 ? Double(silenceFrameCount) / Double(totalFrames) : 0
        let pauseFreq: AudioPattern.PauseFrequency = silenceRatio > 0.45 ? .frequent
                                                   : silenceRatio > 0.2  ? .occasional
                                                   : .rare

        // Variance as speed proxy: low variance + high dB → rapid; high variance → measured
        let variance = decibelHistory.map { pow(Double($0 - Float(avgDb)), 2) }.reduce(0, +)
                       / Double(max(1, decibelHistory.count))
        let speed: AudioPattern.SpeakingSpeed = variance < 5 && intensity > 0.5 ? .rapid
                                              : variance > 20                   ? .measured
                                              : .measured

        currentPattern = AudioPattern(
            id: UUID(),
            timestamp: .now,
            speakingSpeedIndicator: speed,
            pauseFrequency: pauseFreq,
            estimatedIntensity: intensity,
            rawDecibels: Float(avgDb)
        )

        speechFrameCount  = 0
        silenceFrameCount = 0
    }

    // MARK: - Mock

    func injectMockPattern() {
        currentPattern = AudioPattern(
            id: UUID(),
            timestamp: .now,
            speakingSpeedIndicator: .measured,
            pauseFrequency: .occasional,
            estimatedIntensity: 0.55,
            rawDecibels: -28
        )
        waveformLevels = (0..<40).map { _ in Float.random(in: 0.1...0.8) }
    }
}
