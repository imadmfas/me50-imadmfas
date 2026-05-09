import Foundation
import SwiftData

@Model
final class SessionRecord {
    var id: UUID
    var startedAt: Date
    var endedAt: Date?
    var cameraSource: CameraSource
    var audioSource: AudioSource
    var locationLabel: String?
    var observationCount: Int

    init(
        id: UUID = UUID(),
        startedAt: Date = .now,
        cameraSource: CameraSource = .iphone,
        audioSource: AudioSource = .iphone,
        locationLabel: String? = nil
    ) {
        self.id = id
        self.startedAt = startedAt
        self.cameraSource = cameraSource
        self.audioSource = audioSource
        self.locationLabel = locationLabel
        self.observationCount = 0
    }

    var duration: TimeInterval {
        (endedAt ?? .now).timeIntervalSince(startedAt)
    }
}

enum CameraSource: String, Codable {
    case metaGlasses = "Meta Glasses"
    case iphone      = "iPhone Camera"
}

enum AudioSource: String, Codable {
    case metaGlasses = "Meta Glasses Mic"
    case iphone      = "iPhone Mic"
}
