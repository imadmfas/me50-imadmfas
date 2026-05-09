import Foundation

/// Combines visual and audio signals into conversational guidance phrases.
/// All output is deliberately framed in uncertain, supportive language.
struct ConversationSupportEngine {

    static func synthesize(
        visualObservations: [EmotionObservation],
        audioPattern: AudioPattern?,
        locationContext: LocationContext?
    ) -> [EmotionObservation] {
        var composite: [EmotionObservation] = []
        let sessionID = UUID()

        let hasStressSignals = visualObservations.contains { obs in
            obs.observationText.localizedCaseInsensitiveContains("stress")
                || obs.observationText.localizedCaseInsensitiveContains("tension")
                || obs.observationText.localizedCaseInsensitiveContains("pressure")
        }
        let hasTiredSignals = visualObservations.contains { $0.observationText.localizedCaseInsensitiveContains("tired") }
        let hasWarmSignals  = visualObservations.contains { $0.observationText.localizedCaseInsensitiveContains("warmth") }
        let audioIntense    = (audioPattern?.estimatedIntensity ?? 0) > 0.65

        // Stress + fast speech → possible overwhelm
        if hasStressSignals && (audioPattern?.speakingSpeedIndicator == .rapid || audioIntense) {
            composite.append(EmotionObservation(
                observationText: "The combination of visual and vocal cues may suggest the person is feeling some pressure. A calm, unhurried response may help.",
                confidenceLevel: 0.6,
                category: .composite,
                sessionID: sessionID
            ))
        }

        // Tired + slow speech → possible low energy
        if hasTiredSignals && audioPattern?.speakingSpeedIndicator == .measured {
            composite.append(EmotionObservation(
                observationText: "The person may be experiencing low energy. Keeping the conversation light and supportive may be helpful.",
                confidenceLevel: 0.55,
                category: .composite,
                sessionID: sessionID
            ))
        }

        // Warmth + engagement → good connection
        if hasWarmSignals && !audioIntense {
            composite.append(EmotionObservation(
                observationText: "There may be a comfortable openness in this interaction — a good moment for meaningful conversation.",
                confidenceLevel: 0.5,
                category: .composite,
                sessionID: sessionID
            ))
        }

        // Frequent pauses → needs space
        if audioPattern?.pauseFrequency == .frequent {
            composite.append(EmotionObservation(
                observationText: "The person may be taking time to formulate thoughts. Allowing space and not rushing the exchange may be appreciated.",
                confidenceLevel: 0.52,
                category: .conversational,
                sessionID: sessionID
            ))
        }

        // Location modifier
        if let influence = locationContext?.conversationalInfluence {
            composite.append(EmotionObservation(
                observationText: influence,
                confidenceLevel: 0.4,
                category: .environmental,
                sessionID: sessionID
            ))
        }

        return composite
    }

    // MARK: - Timed conversation prompts

    static func timedPrompts() -> [String] {
        [
            "You may want to ask how their day is going.",
            "A simple check-in may open the conversation.",
            "Listening without judgment may be what is needed right now.",
            "Reflecting what you hear rather than advising may create connection.",
            "A short pause before responding may be appreciated.",
            "Asking an open-ended question may invite deeper sharing.",
        ]
    }
}
