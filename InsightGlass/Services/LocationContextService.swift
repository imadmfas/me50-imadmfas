import Foundation
import CoreLocation
import Combine

final class LocationContextService: NSObject, ObservableObject {
    @Published private(set) var currentContext: LocationContext?
    @Published private(set) var authorizationStatus: CLAuthorizationStatus = .notDetermined

    private let manager = CLLocationManager()
    private var isEnabled: Bool

    init(enabled: Bool) {
        self.isEnabled = enabled
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
    }

    func setEnabled(_ value: Bool) {
        isEnabled = value
        if value {
            requestPermissionIfNeeded()
        } else {
            manager.stopUpdatingLocation()
            currentContext = nil
        }
    }

    private func requestPermissionIfNeeded() {
        switch manager.authorizationStatus {
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse, .authorizedAlways:
            manager.startUpdatingLocation()
        default:
            break
        }
    }

    private func classifyEnvironment(from location: CLLocation) -> LocationContext.EnvironmentLabel {
        // Without reverse geocoding, use speed and altitude heuristics
        if location.speed > 10 { return .travel }
        // A full implementation would use MKLocalSearch or reverse geocoding with
        // Places API to determine venue category. We return .unknown as a safe default.
        return .unknown
    }
}

extension LocationContextService: CLLocationManagerDelegate {
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus
        if isEnabled && (manager.authorizationStatus == .authorizedWhenInUse
                         || manager.authorizationStatus == .authorizedAlways) {
            manager.startUpdatingLocation()
        }
    }

    func locationManager(_ manager: CLLocationManager,
                         didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last, isEnabled else { return }
        let label = classifyEnvironment(from: location)
        currentContext = LocationContext(
            label: label,
            coordinate: location.coordinate,
            timestamp: location.timestamp
        )
    }
}
