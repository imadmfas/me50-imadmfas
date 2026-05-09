import SwiftUI
import SwiftData

@main
struct InsightGlassApp: App {
    @StateObject private var appState = AppState()

    var sharedModelContainer: ModelContainer = {
        let schema = Schema([SessionRecord.self, EmotionObservation.self])
        let config = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
        do {
            return try ModelContainer(for: schema, configurations: [config])
        } catch {
            fatalError("Could not create ModelContainer: \(error)")
        }
    }()

    var body: some Scene {
        WindowGroup {
            if appState.hasAcceptedDisclaimer {
                ContentView()
                    .environmentObject(appState)
                    .modelContainer(sharedModelContainer)
                    .preferredColorScheme(.dark)
            } else {
                DisclaimerView()
                    .environmentObject(appState)
                    .preferredColorScheme(.dark)
            }
        }
    }
}
