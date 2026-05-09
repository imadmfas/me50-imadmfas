import SwiftUI

struct VoiceControlsView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        ZStack {
            Color(hex: "061018").ignoresSafeArea()

            ScrollView {
                VStack(spacing: 20) {
                    // Response mode picker
                    GlassmorphicCard {
                        VStack(alignment: .leading, spacing: 16) {
                            Label("Response Mode", systemImage: "speaker.wave.2")
                                .font(.headline)
                                .foregroundStyle(.white)

                            ForEach(ResponseMode.allCases, id: \.self) { mode in
                                ResponseModeRow(
                                    mode: mode,
                                    isSelected: appState.responseMode == mode
                                ) {
                                    appState.setResponseMode(mode)
                                }
                            }
                        }
                        .padding(20)
                    }

                    // Voice preview
                    GlassmorphicCard {
                        VStack(alignment: .leading, spacing: 14) {
                            Label("Preview", systemImage: "play.circle")
                                .font(.headline)
                                .foregroundStyle(.white)

                            Text("Tap below to hear a sample observation in the current mode.")
                                .font(.caption)
                                .foregroundStyle(.secondary)

                            Button {
                                previewVoice()
                            } label: {
                                HStack {
                                    Image(systemName: "waveform")
                                    Text("Play Sample")
                                        .font(.subheadline.weight(.semibold))
                                }
                                .foregroundStyle(.black)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(
                                    RoundedRectangle(cornerRadius: 12)
                                        .fill(LinearGradient(colors: [.cyan, .blue.opacity(0.9)],
                                                             startPoint: .leading, endPoint: .trailing))
                                )
                            }
                            .disabled(appState.responseMode == .silent)
                            .opacity(appState.responseMode == .silent ? 0.4 : 1.0)
                        }
                        .padding(20)
                    }

                    // Mode descriptions
                    GlassmorphicCard {
                        VStack(alignment: .leading, spacing: 12) {
                            Label("Mode Details", systemImage: "info.circle")
                                .font(.headline)
                                .foregroundStyle(.white)

                            modeLine(title: "Short",
                                     detail: "Speaks only the highest-confidence observation. Minimal interruption.",
                                     icon: "1.circle")
                            modeLine(title: "Detailed",
                                     detail: "Reads all observations ranked by confidence. Useful for deep analysis.",
                                     icon: "list.bullet")
                            modeLine(title: "Silent (Subtitles)",
                                     detail: "No speech output. Observations appear as text overlays only.",
                                     icon: "captions.bubble")
                        }
                        .padding(20)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 16)
                .padding(.bottom, 100)
            }
        }
        .navigationTitle("Voice Controls")
        .navigationBarTitleDisplayMode(.large)
    }

    private func previewVoice() {
        let engine = VoiceResponseEngine()
        let sample = "The person may appear tired. A calm, supportive conversation may help."
        engine.speak(sample, mode: appState.responseMode)
    }

    private func modeLine(title: String, detail: String, icon: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.subheadline)
                .foregroundStyle(.cyan.opacity(0.7))
                .frame(width: 22)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline.weight(.semibold)).foregroundStyle(.white)
                Text(detail).font(.caption).foregroundStyle(.secondary)
            }
        }
    }
}

struct ResponseModeRow: View {
    let mode: ResponseMode
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack {
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(isSelected ? .cyan : .white.opacity(0.3))
                    .font(.title3)
                VStack(alignment: .leading, spacing: 2) {
                    Text(mode.rawValue)
                        .font(.subheadline.weight(isSelected ? .semibold : .regular))
                        .foregroundStyle(.white)
                }
                Spacer()
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}
