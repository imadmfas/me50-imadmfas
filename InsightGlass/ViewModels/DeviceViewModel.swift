import SwiftUI
import Combine

@MainActor
final class DeviceViewModel: ObservableObject {
    @Published var glassesState: MetaGlassesState = .disconnected
    @Published var showScanResult: String? = nil

    private let glassesService: MetaGlassesService
    private var cancellables = Set<AnyCancellable>()

    init(glassesService: MetaGlassesService) {
        self.glassesService = glassesService

        glassesService.$state
            .receive(on: DispatchQueue.main)
            .assign(to: &$glassesState)
    }

    var isConnected: Bool {
        glassesState.connectionStatus == .connected
    }

    var batteryText: String {
        if let level = glassesState.batteryLevel {
            return "\(level)%"
        }
        return "—"
    }

    func startScan() {
        glassesService.startScanning()
    }

    func disconnect() {
        glassesService.disconnect()
    }

    func connectMock() {
        glassesService.injectMockConnection()
    }

    var cameraStatusText: String {
        glassesState.cameraAvailable
            ? "Camera stream available"
            : "Camera stream unavailable — using iPhone camera"
    }

    var cameraStatusIcon: String {
        glassesState.cameraAvailable ? "video.fill" : "iphone"
    }
}
