import SwiftUI
import Combine

enum ResponseMode: String, CaseIterable, Codable {
    case short = "Short"
    case detailed = "Detailed"
    case silent = "Silent (Subtitles)"
}

final class AppState: ObservableObject {
    @Published var hasAcceptedDisclaimer: Bool
    @Published var responseMode: ResponseMode
    @Published var isSessionActive: Bool = false
    @Published var useLocationContext: Bool = false
    @Published var isMockMode: Bool = false

    private let defaults = UserDefaults.standard

    init() {
        self.hasAcceptedDisclaimer = defaults.bool(forKey: "hasAcceptedDisclaimer")
        let rawMode = defaults.string(forKey: "responseMode") ?? ResponseMode.short.rawValue
        self.responseMode = ResponseMode(rawValue: rawMode) ?? .short
        self.useLocationContext = defaults.bool(forKey: "useLocationContext")
        self.isMockMode = defaults.bool(forKey: "isMockMode")
    }

    func acceptDisclaimer() {
        hasAcceptedDisclaimer = true
        defaults.set(true, forKey: "hasAcceptedDisclaimer")
    }

    func setResponseMode(_ mode: ResponseMode) {
        responseMode = mode
        defaults.set(mode.rawValue, forKey: "responseMode")
    }

    func deleteAllData() {
        let domain = Bundle.main.bundleIdentifier!
        defaults.removePersistentDomain(forName: domain)
        hasAcceptedDisclaimer = false
        responseMode = .short
        useLocationContext = false
        isSessionActive = false
    }
}
