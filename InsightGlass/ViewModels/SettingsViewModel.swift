import SwiftUI
import SwiftData
import Combine

@MainActor
final class SettingsViewModel: ObservableObject {
    @Published var showDeleteConfirmation: Bool = false
    @Published var dataDeleted: Bool = false

    private let privacyManager: PrivacyManager
    let appState: AppState

    init(privacyManager: PrivacyManager, appState: AppState) {
        self.privacyManager = privacyManager
        self.appState = appState
    }

    var cameraStatus: String    { privacyManager.cameraPermissionLabel }
    var micStatus: String       { privacyManager.micPermissionLabel }
    var locationStatus: String  { privacyManager.locationPermissionLabel }

    func refreshPermissions() {
        privacyManager.refresh()
    }

    func requestCameraPermission() {
        privacyManager.requestCameraPermission { _ in }
    }

    func requestMicPermission() {
        privacyManager.requestMicrophonePermission { _ in }
    }

    func deleteAllData(modelContext: ModelContext) {
        privacyManager.deleteAllLocalData(modelContext: modelContext)
        appState.deleteAllData()
        dataDeleted = true
    }
}
