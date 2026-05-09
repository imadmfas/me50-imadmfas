import Foundation
import AVFoundation
import CoreLocation
import SwiftData

final class PrivacyManager: ObservableObject {
    @Published private(set) var cameraPermission:   AVAuthorizationStatus = .notDetermined
    @Published private(set) var microphonePermission: AVAuthorizationStatus = .notDetermined
    @Published private(set) var locationPermission: CLAuthorizationStatus  = .notDetermined

    private let locationManager = CLLocationManager()

    init() { refresh() }

    func refresh() {
        cameraPermission    = AVCaptureDevice.authorizationStatus(for: .video)
        microphonePermission = AVCaptureDevice.authorizationStatus(for: .audio)
        locationPermission  = locationManager.authorizationStatus
    }

    func requestCameraPermission(completion: @escaping (Bool) -> Void) {
        AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
            DispatchQueue.main.async {
                self?.refresh()
                completion(granted)
            }
        }
    }

    func requestMicrophonePermission(completion: @escaping (Bool) -> Void) {
        AVCaptureDevice.requestAccess(for: .audio) { [weak self] granted in
            DispatchQueue.main.async {
                self?.refresh()
                completion(granted)
            }
        }
    }

    // MARK: - Data deletion

    func deleteAllLocalData(modelContext: ModelContext) {
        do {
            try modelContext.delete(model: EmotionObservation.self)
            try modelContext.delete(model: SessionRecord.self)
            try modelContext.save()
        } catch {
            // Silently log; surface in UI if needed
        }
    }

    // MARK: - Permission display helpers

    var cameraPermissionLabel: String {
        statusLabel(for: cameraPermission)
    }

    var micPermissionLabel: String {
        statusLabel(for: microphonePermission)
    }

    var locationPermissionLabel: String {
        switch locationPermission {
        case .authorizedWhenInUse: return "When In Use"
        case .authorizedAlways:    return "Always"
        case .denied:              return "Denied"
        case .restricted:          return "Restricted"
        case .notDetermined:       return "Not Requested"
        @unknown default:          return "Unknown"
        }
    }

    private func statusLabel(for status: AVAuthorizationStatus) -> String {
        switch status {
        case .authorized:      return "Granted"
        case .denied:          return "Denied"
        case .restricted:      return "Restricted"
        case .notDetermined:   return "Not Requested"
        @unknown default:      return "Unknown"
        }
    }
}
