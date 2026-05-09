import SwiftUI

struct DisclaimerView: View {
    @EnvironmentObject private var appState: AppState
    @State private var hasScrolledToBottom = false
    @State private var appeared = false

    var body: some View {
        ZStack {
            // Ambient background
            RadialGradient(
                colors: [Color(hex: "0D1B2A"), Color(hex: "061018")],
                center: .center, startRadius: 0, endRadius: 500
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                VStack(spacing: 12) {
                    Image(systemName: "eye.trianglebadge.exclamationmark")
                        .font(.system(size: 52, weight: .ultraLight))
                        .foregroundStyle(
                            LinearGradient(colors: [.cyan, .blue], startPoint: .topLeading, endPoint: .bottomTrailing)
                        )
                        .padding(.top, 48)
                        .opacity(appeared ? 1 : 0)
                        .offset(y: appeared ? 0 : 20)
                        .animation(.spring(response: 0.6).delay(0.1), value: appeared)

                    Text("Insight Glass")
                        .font(.title.bold())
                        .foregroundStyle(.white)
                        .opacity(appeared ? 1 : 0)
                        .animation(.spring(response: 0.6).delay(0.2), value: appeared)

                    Text("Personal Wellbeing Observer")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .opacity(appeared ? 1 : 0)
                        .animation(.spring(response: 0.6).delay(0.3), value: appeared)
                }
                .padding(.bottom, 32)

                // Disclaimer scroll area
                ScrollView {
                    ScrollViewReader { proxy in
                        VStack(alignment: .leading, spacing: 20) {
                            disclaimerSection(
                                icon: "info.circle",
                                title: "About This Application",
                                body: "Insight Glass provides speculative, probabilistic observations about conversational and wellbeing cues. It is an experimental personal communication support tool.",
                                color: .cyan
                            )
                            disclaimerSection(
                                icon: "cross.case",
                                title: "Not Medical or Psychological Advice",
                                body: "This application does NOT provide psychological diagnoses, medical assessments, psychiatric evaluations, lie detection, personality profiling, or any form of clinical analysis.\n\nAll outputs are expressed as possibilities and suggestions, never as facts or certainties.",
                                color: .orange
                            )
                            disclaimerSection(
                                icon: "person.badge.shield.checkmark",
                                title: "Ethical Use Only",
                                body: "You may only use this app to support empathetic personal communication with people who are aware of its use. Using this app for surveillance, profiling, or manipulation is prohibited.",
                                color: .green
                            )
                            disclaimerSection(
                                icon: "lock.shield",
                                title: "Privacy",
                                body: "All analysis occurs on-device. No audio, video, or personal data is transmitted externally unless you explicitly enable cloud sync. You can delete all data at any time.",
                                color: .purple
                            )
                            disclaimerSection(
                                icon: "eyeglasses",
                                title: "Meta Glasses",
                                body: "If using Meta smart glasses, the glasses recording LED will illuminate as required by Meta's hardware privacy system. This app never bypasses hardware privacy controls.",
                                color: .blue
                            )

                            // Invisible bottom anchor
                            Color.clear.frame(height: 1).id("bottom")
                                .onAppear { hasScrolledToBottom = true }
                        }
                        .padding(.horizontal, 20)
                        .padding(.bottom, 24)
                    }
                }
                .opacity(appeared ? 1 : 0)
                .animation(.easeIn(duration: 0.4).delay(0.4), value: appeared)

                // Accept button
                VStack(spacing: 12) {
                    Button {
                        appState.acceptDisclaimer()
                    } label: {
                        Text("I Understand and Agree")
                            .font(.headline)
                            .foregroundStyle(.black)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(
                                        LinearGradient(
                                            colors: [.cyan, .blue.opacity(0.8)],
                                            startPoint: .leading, endPoint: .trailing
                                        )
                                    )
                            )
                    }
                    .padding(.horizontal, 24)
                    .opacity(appeared ? 1 : 0)
                    .animation(.spring(response: 0.5).delay(0.6), value: appeared)

                    Text("Scroll through the terms above before continuing")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                        .opacity(appeared ? 1 : 0)
                        .animation(.easeIn.delay(0.7), value: appeared)
                }
                .padding(.bottom, 36)
            }
        }
        .onAppear { appeared = true }
    }

    private func disclaimerSection(icon: String, title: String, body: String, color: Color) -> some View {
        GlassmorphicCard {
            HStack(alignment: .top, spacing: 14) {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundStyle(color)
                    .frame(width: 28)

                VStack(alignment: .leading, spacing: 6) {
                    Text(title)
                        .font(.subheadline.bold())
                        .foregroundStyle(.white)
                    Text(body)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(16)
        }
    }
}

// MARK: - Hex Color helper

extension Color {
    init(hex: String) {
        let scanner = Scanner(string: hex)
        var rgb: UInt64 = 0
        scanner.scanHexInt64(&rgb)
        self.init(
            red:   Double((rgb >> 16) & 0xFF) / 255,
            green: Double((rgb >> 8)  & 0xFF) / 255,
            blue:  Double( rgb        & 0xFF) / 255
        )
    }
}
