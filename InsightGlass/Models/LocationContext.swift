import Foundation
import CoreLocation

struct LocationContext {
    let label: EnvironmentLabel
    let coordinate: CLLocationCoordinate2D?
    let timestamp: Date

    enum EnvironmentLabel: String, CaseIterable {
        case home        = "Home"
        case work        = "Work"
        case travel      = "Travel"
        case crowded     = "Crowded Space"
        case restaurant  = "Restaurant"
        case outdoor     = "Outdoor"
        case unknown     = "Unknown"
    }

    var conversationalInfluence: String? {
        switch label {
        case .crowded:
            return "The environment may be loud or distracting — a calm, brief exchange may be appreciated."
        case .work:
            return "A professional context may be influencing the conversation dynamics."
        case .restaurant:
            return "A relaxed social setting may encourage open conversation."
        case .travel:
            return "Travel situations may add fatigue or stress to the interaction."
        default:
            return nil
        }
    }
}
