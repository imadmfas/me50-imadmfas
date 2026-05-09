import Foundation

struct AudioPattern {
    let id: UUID
    let timestamp: Date
    let speakingSpeedIndicator: SpeakingSpeed
    let pauseFrequency: PauseFrequency
    let estimatedIntensity: Double       // 0.0 – 1.0
    let rawDecibels: Float

    enum SpeakingSpeed: String {
        case slow    = "Slow"
        case measured = "Measured"
        case rapid   = "Rapid"
    }

    enum PauseFrequency: String {
        case frequent   = "Frequent"
        case occasional = "Occasional"
        case rare       = "Rare"
    }

    var observationTexts: [String] {
        var results: [String] = []
        switch speakingSpeedIndicator {
        case .rapid:
            results.append("The speaking pace may suggest elevated energy or stress.")
        case .slow:
            results.append("The measured pace may reflect careful thought or low energy.")
        case .measured:
            results.append("The speaking pace appears relaxed and composed.")
        }
        switch pauseFrequency {
        case .frequent:
            results.append("Frequent pauses may suggest the person is choosing words carefully or feeling uncertain.")
        case .occasional:
            break
        case .rare:
            results.append("Continuous speech may indicate high engagement or emotional pressure.")
        }
        if estimatedIntensity > 0.7 {
            results.append("The vocal intensity may suggest emotional engagement or pressure.")
        }
        return results
    }
}
