import Foundation

struct MetaGlassesState {
    var connectionStatus: ConnectionStatus
    var batteryLevel: Int?          // 0–100, nil if unknown
    var cameraAvailable: Bool
    var microphoneAvailable: Bool
    var speakerAvailable: Bool
    var firmwareVersion: String?
    var deviceName: String?

    static var disconnected: MetaGlassesState {
        MetaGlassesState(
            connectionStatus: .disconnected,
            batteryLevel: nil,
            cameraAvailable: false,
            microphoneAvailable: false,
            speakerAvailable: false,
            firmwareVersion: nil,
            deviceName: nil
        )
    }

    enum ConnectionStatus: String {
        case disconnected  = "Disconnected"
        case scanning      = "Scanning…"
        case connecting    = "Connecting…"
        case connected     = "Connected"
        case unsupported   = "SDK Unavailable"
    }

    var statusColor: String {
        switch connectionStatus {
        case .connected:    return "statusConnected"
        case .connecting,
             .scanning:     return "statusPending"
        case .disconnected,
             .unsupported:  return "statusDisconnected"
        }
    }
}
