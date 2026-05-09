import SwiftUI
import SwiftData

struct PrivacySettingsView: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.modelContext) private var modelContext
    @StateObject private var settingsVM: SettingsViewModel
    @State private var showDeleteConfirmation = false
    @State private var showDataDeletedBanner = false

    init(privacyManager: PrivacyManager) {
        _settingsVM = StateObject(wrappedValue: SettingsViewModel(
            privacyManager: privacyManager,
            appState: AppState()
        ))
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "061018").ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 16) {
                        permissionsCard
                        dataStorageCard
                        responseSettingsCard
                        locationCard
                        dangerZoneCard
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 16)
                    .padding(.bottom, 100)
                }

                // Data deleted banner
                if showDataDeletedBanner {
                    VStack {
                        Spacer()
                        HStack(spacing: 10) {
                            Image(systemName: "checkmark.circle.fill").foregroundStyle(.green)
                            Text("All data deleted").font(.subheadline.weight(.semibold))
                        }
                        .padding()
                        .background(RoundedRectangle(cornerRadius: 14).fill(.ultraThinMaterial))
                        .padding(.bottom, 110)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                    }
                }
            }
            .navigationTitle("Privacy")
            .navigationBarTitleDisplayMode(.large)
            .onAppear { settingsVM.refreshPermissions() }
            .confirmationDialog(
                "Delete all local data?",
                isPresented: $showDeleteConfirmation,
                titleVisibility: .visible
            ) {
                Button("Delete Everything", role: .destructive) {
                    settingsVM.deleteAllData(modelContext: modelContext)
                    withAnimation { showDataDeletedBanner = true }
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
                        withAnimation { showDataDeletedBanner = false }
                    }
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This removes all sessions, observations, and settings. This action cannot be undone.")
            }
        }
    }

    private var permissionsCard: some View {
        GlassmorphicCard {
            VStack(alignment: .leading, spacing: 16) {
                Label("App Permissions", systemImage: "checkmark.shield")
                    .font(.headline).foregroundStyle(.white)

                permissionRow(title: "Camera",
                              status: settingsVM.cameraStatus,
                              icon: "camera",
                              granted: settingsVM.cameraStatus == "Granted") {
                    settingsVM.requestCameraPermission()
                }
                Divider().opacity(0.15)
                permissionRow(title: "Microphone",
                              status: settingsVM.micStatus,
                              icon: "mic",
                              granted: settingsVM.micStatus == "Granted") {
                    settingsVM.requestMicPermission()
                }
                Divider().opacity(0.15)
                permissionRow(title: "Location (Optional)",
                              status: settingsVM.locationStatus,
                              icon: "location",
                              granted: settingsVM.locationStatus.contains("Authorized") || settingsVM.locationStatus == "When In Use" || settingsVM.locationStatus == "Always") {
                }
            }
            .padding(20)
        }
    }

    private var dataStorageCard: some View {
        GlassmorphicCard {
            VStack(alignment: .leading, spacing: 14) {
                Label("Data Storage", systemImage: "internaldrive")
                    .font(.headline).foregroundStyle(.white)

                infoRow(icon: "iphone", text: "All analysis data stored locally on this device")
                infoRow(icon: "lock.fill", text: "No external transmission unless cloud sync is enabled")
                infoRow(icon: "eye.slash", text: "No behavioral profiles are built or shared")
                infoRow(icon: "trash", text: "You can delete all data at any time")
            }
            .padding(20)
        }
    }

    private var responseSettingsCard: some View {
        GlassmorphicCard {
            VStack(alignment: .leading, spacing: 14) {
                Label("Response Settings", systemImage: "speaker.wave.2")
                    .font(.headline).foregroundStyle(.white)

                // This is a shortcut to VoiceControlsView settings inline
                Picker("Response Mode", selection: Binding(
                    get: { appState.responseMode },
                    set: { appState.setResponseMode($0) }
                )) {
                    ForEach(ResponseMode.allCases, id: \.self) { mode in
                        Text(mode.rawValue).tag(mode)
                    }
                }
                .pickerStyle(.segmented)
                .colorMultiply(.cyan.opacity(0.8))
            }
            .padding(20)
        }
    }

    private var locationCard: some View {
        GlassmorphicCard {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Label("Location Context", systemImage: "location.circle")
                        .font(.subheadline.bold()).foregroundStyle(.white)
                    Text("Allows environmental context (home, work, travel)\nto subtly influence observations.")
                        .font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Toggle("", isOn: $appState.useLocationContext)
                    .tint(.cyan)
            }
            .padding(20)
        }
    }

    private var dangerZoneCard: some View {
        GlassmorphicCard(opacity: 0.06, borderOpacity: 0.15) {
            VStack(alignment: .leading, spacing: 16) {
                Label("Data Management", systemImage: "exclamationmark.triangle")
                    .font(.headline).foregroundStyle(.orange)

                Button {
                    showDeleteConfirmation = true
                } label: {
                    HStack {
                        Image(systemName: "trash.fill")
                        Text("Delete All Data")
                            .font(.subheadline.weight(.semibold))
                    }
                    .foregroundStyle(.red)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.red.opacity(0.1))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .strokeBorder(Color.red.opacity(0.25), lineWidth: 1)
                            )
                    )
                }

                Text("Permanently removes all sessions, observations, and app preferences from this device.")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
            .padding(20)
        }
    }

    private func permissionRow(title: String, status: String, icon: String,
                                granted: Bool, onRequest: @escaping () -> Void) -> some View {
        HStack {
            Image(systemName: icon)
                .font(.subheadline)
                .foregroundStyle(granted ? .cyan : .orange)
                .frame(width: 22)
            Text(title).font(.subheadline).foregroundStyle(.white)
            Spacer()
            if !granted && status == "Not Requested" {
                Button("Allow") { onRequest() }
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.cyan)
            } else {
                Text(status)
                    .font(.caption)
                    .foregroundStyle(granted ? .green : .orange)
            }
        }
    }

    private func infoRow(icon: String, text: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon).font(.caption).foregroundStyle(.cyan.opacity(0.7)).frame(width: 16)
            Text(text).font(.caption).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
        }
    }
}
