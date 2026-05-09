import SwiftUI

struct DeviceConnectionView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var deviceVM: DeviceViewModel

    init(glassesService: MetaGlassesService) {
        _deviceVM = StateObject(wrappedValue: DeviceViewModel(glassesService: glassesService))
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "061018").ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 16) {
                        // Connection card
                        connectionCard
                        // Capability matrix
                        capabilityCard
                        // SDK note
                        sdkNoteCard
                        // Mock mode toggle
                        mockModeCard
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 16)
                    .padding(.bottom, 100)
                }
            }
            .navigationTitle("Device")
            .navigationBarTitleDisplayMode(.large)
        }
    }

    private var connectionCard: some View {
        GlassmorphicCard {
            VStack(spacing: 20) {
                // Glasses icon
                ZStack {
                    Circle()
                        .fill(deviceVM.isConnected ? Color.green.opacity(0.1) : Color.white.opacity(0.05))
                        .frame(width: 80, height: 80)
                    Image(systemName: "eyeglasses")
                        .font(.system(size: 36, weight: .thin))
                        .foregroundStyle(deviceVM.isConnected ? .green : .secondary)
                }

                VStack(spacing: 6) {
                    Text(deviceVM.glassesState.deviceName ?? "Meta Smart Glasses")
                        .font(.headline)
                        .foregroundStyle(.white)
                    ConnectionStatusBadge(state: deviceVM.glassesState)
                }

                if let battery = deviceVM.glassesState.batteryLevel {
                    HStack(spacing: 6) {
                        Image(systemName: batteryIcon(battery))
                            .foregroundStyle(batteryColor(battery))
                        Text("\(battery)%")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }

                // Action buttons
                HStack(spacing: 12) {
                    if deviceVM.isConnected {
                        Button("Disconnect") { deviceVM.disconnect() }
                            .buttonStyle(SecondaryButtonStyle(color: .red.opacity(0.7)))
                    } else {
                        Button("Scan for Glasses") { deviceVM.startScan() }
                            .buttonStyle(PrimaryButtonStyle())
                    }
                }
            }
            .padding(24)
        }
    }

    private var capabilityCard: some View {
        GlassmorphicCard {
            VStack(alignment: .leading, spacing: 14) {
                Label("Active Hardware Sources", systemImage: "cpu")
                    .font(.headline)
                    .foregroundStyle(.white)

                capabilityRow(
                    icon: deviceVM.glassesState.cameraAvailable ? "video.fill" : "iphone",
                    title: "Camera",
                    detail: deviceVM.cameraStatusText,
                    available: deviceVM.glassesState.cameraAvailable,
                    fallback: true
                )
                capabilityRow(
                    icon: deviceVM.glassesState.microphoneAvailable ? "mic.fill" : "mic",
                    title: "Microphone",
                    detail: deviceVM.glassesState.microphoneAvailable ? "Meta Glasses Mic active" : "iPhone Mic active",
                    available: deviceVM.glassesState.microphoneAvailable,
                    fallback: true
                )
                capabilityRow(
                    icon: deviceVM.glassesState.speakerAvailable ? "speaker.wave.2.fill" : "speaker",
                    title: "Speaker",
                    detail: deviceVM.glassesState.speakerAvailable ? "Meta Glasses Speaker active" : "iPhone Speaker active",
                    available: deviceVM.glassesState.speakerAvailable,
                    fallback: true
                )
            }
            .padding(20)
        }
    }

    private var sdkNoteCard: some View {
        GlassmorphicCard(opacity: 0.08) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "exclamationmark.triangle")
                    .foregroundStyle(.orange)
                    .font(.subheadline)
                    .padding(.top, 2)
                VStack(alignment: .leading, spacing: 6) {
                    Text("SDK Limitation Notice")
                        .font(.subheadline.bold())
                        .foregroundStyle(.white)
                    Text("Direct camera streaming from Meta glasses is not currently available via the public Meta SDK. The app automatically uses the iPhone front camera as a fallback.\n\nBluetooth connection provides microphone and speaker routing through the glasses when connected.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(16)
        }
    }

    private var mockModeCard: some View {
        GlassmorphicCard {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Label("Demo Mode", systemImage: "sparkles")
                        .font(.subheadline.bold())
                        .foregroundStyle(.white)
                    Text("Uses simulated observations for testing.\nNo camera or microphone required.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Toggle("", isOn: $appState.isMockMode)
                    .tint(.cyan)
            }
            .padding(20)
        }
    }

    private func capabilityRow(icon: String, title: String, detail: String,
                                available: Bool, fallback: Bool) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.subheadline)
                .foregroundStyle(available ? .cyan : .orange)
                .frame(width: 22)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline).foregroundStyle(.white)
                Text(detail).font(.caption2).foregroundStyle(.secondary)
            }
            Spacer()
            if !available && fallback {
                Text("Fallback")
                    .font(.caption2.weight(.medium))
                    .foregroundStyle(.orange)
                    .padding(.horizontal, 7).padding(.vertical, 3)
                    .background(Capsule().fill(Color.orange.opacity(0.12)))
            } else if available {
                Text("Active")
                    .font(.caption2.weight(.medium))
                    .foregroundStyle(.green)
                    .padding(.horizontal, 7).padding(.vertical, 3)
                    .background(Capsule().fill(Color.green.opacity(0.12)))
            }
        }
    }

    private func batteryIcon(_ level: Int) -> String {
        switch level {
        case 76...100: return "battery.100"
        case 51...75:  return "battery.75"
        case 26...50:  return "battery.50"
        case 11...25:  return "battery.25"
        default:       return "battery.0"
        }
    }

    private func batteryColor(_ level: Int) -> Color {
        level > 25 ? .green : .red
    }
}

// MARK: - Button styles

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(.black)
            .padding(.horizontal, 20)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(LinearGradient(colors: [.cyan, .blue.opacity(0.9)],
                                        startPoint: .leading, endPoint: .trailing))
            )
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    var color: Color = .white.opacity(0.2)

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(.white)
            .padding(.horizontal, 20)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(color)
            )
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
    }
}
