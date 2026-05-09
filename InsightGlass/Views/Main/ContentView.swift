import SwiftUI
import SwiftData

struct ContentView: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.modelContext) private var modelContext

    // Shared services — constructed once here and passed down
    @StateObject private var glassesService   = MetaGlassesService()
    @StateObject private var voiceEngine      = VoiceResponseEngine()
    @StateObject private var privacyManager   = PrivacyManager()

    @State private var selectedTab: Tab = .live

    enum Tab: String, CaseIterable {
        case live       = "Live"
        case analysis   = "Analysis"
        case history    = "History"
        case device     = "Device"
        case privacy    = "Privacy"

        var icon: String {
            switch self {
            case .live:     return "eye"
            case .analysis: return "waveform.path.ecg"
            case .history:  return "clock.arrow.circlepath"
            case .device:   return "eyeglasses"
            case .privacy:  return "lock.shield"
            }
        }
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            TabView(selection: $selectedTab) {
                LiveView(
                    glassesService: glassesService,
                    voiceEngine: voiceEngine
                )
                .tag(Tab.live)

                AnalysisFeedView()
                    .tag(Tab.analysis)

                HistoryTimelineView()
                    .tag(Tab.history)

                DeviceConnectionView(glassesService: glassesService)
                    .tag(Tab.device)

                PrivacySettingsView(privacyManager: privacyManager)
                    .tag(Tab.privacy)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))

            // Custom tab bar
            customTabBar
        }
        .ignoresSafeArea(edges: .bottom)
        .background(Color(hex: "061018").ignoresSafeArea())
    }

    private var customTabBar: some View {
        HStack(spacing: 0) {
            ForEach(Tab.allCases, id: \.self) { tab in
                Button {
                    withAnimation(.spring(response: 0.35)) {
                        selectedTab = tab
                    }
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: tab.icon)
                            .font(.system(size: selectedTab == tab ? 22 : 18, weight: .medium))
                            .foregroundStyle(selectedTab == tab ? Color.cyan : Color.white.opacity(0.4))
                            .animation(.spring(response: 0.3), value: selectedTab)

                        Text(tab.rawValue)
                            .font(.system(size: 9, weight: selectedTab == tab ? .semibold : .regular))
                            .foregroundStyle(selectedTab == tab ? Color.cyan : Color.white.opacity(0.35))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                }
            }
        }
        .padding(.horizontal, 8)
        .padding(.bottom, 8)
        .background(
            Rectangle()
                .fill(.ultraThinMaterial)
                .overlay(Rectangle().fill(Color.white.opacity(0.06)))
                .overlay(
                    Rectangle()
                        .fill(
                            LinearGradient(
                                colors: [Color.cyan.opacity(0.15), .clear],
                                startPoint: .top, endPoint: .bottom
                            )
                        )
                        .frame(height: 1),
                    alignment: .top
                )
                .ignoresSafeArea(edges: .bottom)
        )
    }
}
