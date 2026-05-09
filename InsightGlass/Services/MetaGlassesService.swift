import Foundation
import CoreBluetooth
import Combine

// Meta's official SDK (MetaHorizonSDK / Ray-Ban Stories SDK) is required at link
// time for production. This service wraps Bluetooth discovery and the SDK surface
// that is available at time of writing. Camera streaming via the SDK is not yet
// publicly supported; the service falls back to the iPhone camera automatically.

final class MetaGlassesService: NSObject, ObservableObject {
    @Published private(set) var state: MetaGlassesState = .disconnected

    private var centralManager: CBCentralManager!
    private var peripheral: CBPeripheral?

    // Known Ray-Ban Meta service UUID prefix pattern used in device advertisement.
    // Replace with the official UUID from the Meta SDK when integrating.
    private let metaServiceUUID = CBUUID(string: "FE59")

    override init() {
        super.init()
        centralManager = CBCentralManager(delegate: self, queue: .main)
    }

    func startScanning() {
        guard centralManager.state == .poweredOn else { return }
        state.connectionStatus = .scanning
        centralManager.scanForPeripherals(withServices: [metaServiceUUID], options: nil)
    }

    func stopScanning() {
        centralManager.stopScan()
        if state.connectionStatus == .scanning {
            state.connectionStatus = .disconnected
        }
    }

    func disconnect() {
        if let p = peripheral {
            centralManager.cancelPeripheralConnection(p)
        }
        state = .disconnected
    }

    // MARK: - Capability queries

    /// Camera streaming is not yet available via the public Meta SDK.
    /// This returns false and the app falls back to the iPhone camera.
    var isCameraStreamAvailable: Bool { false }

    var isMicrophoneAvailable: Bool { state.microphoneAvailable }
    var isSpeakerAvailable: Bool { state.speakerAvailable }

    // MARK: - Mock support for simulator / demo mode

    func injectMockConnection() {
        state = MetaGlassesState(
            connectionStatus: .connected,
            batteryLevel: 82,
            cameraAvailable: false,           // Reflects SDK limitation
            microphoneAvailable: true,
            speakerAvailable: true,
            firmwareVersion: "1.4.2",
            deviceName: "Ray-Ban Meta (Mock)"
        )
    }
}

// MARK: - CBCentralManagerDelegate
extension MetaGlassesService: CBCentralManagerDelegate {
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        switch central.state {
        case .poweredOn:
            break
        case .unsupported, .unauthorized:
            state.connectionStatus = .unsupported
        default:
            state.connectionStatus = .disconnected
        }
    }

    func centralManager(
        _ central: CBCentralManager,
        didDiscover peripheral: CBPeripheral,
        advertisementData: [String: Any],
        rssi RSSI: NSNumber
    ) {
        guard self.peripheral == nil else { return }
        self.peripheral = peripheral
        centralManager.stopScan()
        state.connectionStatus = .connecting
        state.deviceName = peripheral.name
        centralManager.connect(peripheral, options: nil)
    }

    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        state.connectionStatus = .connected
        state.microphoneAvailable = true
        state.speakerAvailable = true
        peripheral.delegate = self
        peripheral.discoverServices(nil)
    }

    func centralManager(
        _ central: CBCentralManager,
        didDisconnectPeripheral peripheral: CBPeripheral,
        error: Error?
    ) {
        self.peripheral = nil
        state = .disconnected
    }

    func centralManager(
        _ central: CBCentralManager,
        didFailToConnect peripheral: CBPeripheral,
        error: Error?
    ) {
        self.peripheral = nil
        state.connectionStatus = .disconnected
    }
}

// MARK: - CBPeripheralDelegate
extension MetaGlassesService: CBPeripheralDelegate {
    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        // Battery level and additional characteristics would be read from
        // the official Meta SDK characteristic UUIDs here.
    }

    func peripheral(
        _ peripheral: CBPeripheral,
        didUpdateValueFor characteristic: CBCharacteristic,
        error: Error?
    ) {
        // Parse battery level (0x2A19 is the standard BLE Battery Level characteristic)
        if characteristic.uuid == CBUUID(string: "2A19"),
           let data = characteristic.value,
           let level = data.first {
            state.batteryLevel = Int(level)
        }
    }
}
