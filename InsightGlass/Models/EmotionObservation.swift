import Foundation
import SwiftData

@Model
final class EmotionObservation {
    var id: UUID
    var timestamp: Date
    var observationText: String
    var confidenceLevel: Double        // 0.0 – 1.0
    var category: ObservationCategory
    var sessionID: UUID
    var locationContextLabel: String?

    init(
        id: UUID = UUID(),
        timestamp: Date = .now,
        observationText: String,
        confidenceLevel: Double,
        category: ObservationCategory,
        sessionID: UUID,
        locationContextLabel: String? = nil
    ) {
        self.id = id
        self.timestamp = timestamp
        self.observationText = observationText
        self.confidenceLevel = confidenceLevel
        self.category = category
        self.sessionID = sessionID
        self.locationContextLabel = locationContextLabel
    }
}

enum ObservationCategory: String, Codable, CaseIterable {
    case visual       = "Visual"
    case vocal        = "Vocal"
    case conversational = "Conversational"
    case environmental  = "Environmental"
    case composite    = "Composite"

    var iconName: String {
        switch self {
        case .visual:          return "eye"
        case .vocal:           return "waveform"
        case .conversational:  return "bubble.left.and.bubble.right"
        case .environmental:   return "location"
        case .composite:       return "sparkles"
        }
    }

    var accentColor: String {
        switch self {
        case .visual:          return "categoryVisual"
        case .vocal:           return "categoryVocal"
        case .conversational:  return "categoryConversational"
        case .environmental:   return "categoryEnvironmental"
        case .composite:       return "categoryComposite"
        }
    }
}
