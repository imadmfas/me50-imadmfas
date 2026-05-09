import SwiftUI

struct ConnectionStatusBadge: View {
    let state: MetaGlassesState

    private var statusColor: Color {
        switch state.connectionStatus {
        case .connected:               return .green
        case .connecting, .scanning:   return .yellow
        case .disconnected, .unsupported: return .red.opacity(0.8)
        }
    }

    var body: some View {
        HStack(spacing: 6) {
            if state.connectionStatus == .scanning || state.connectionStatus == .connecting {
                ProgressView()
                    .scaleEffect(0.7)
                    .tint(.yellow)
            } else {
                Circle()
                    .fill(statusColor)
                    .frame(width: 8, height: 8)
                    .overlay(
                        Circle()
                            .stroke(statusColor.opacity(0.3), lineWidth: 4)
                    )
            }
            Text(state.connectionStatus.rawValue)
                .font(.caption.weight(.medium))
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(
            Capsule()
                .fill(statusColor.opacity(0.12))
                .overlay(Capsule().strokeBorder(statusColor.opacity(0.2), lineWidth: 1))
        )
    }
}

struct CameraSourceBadge: View {
    let source: CameraSource

    var body: some View {
        HStack(spacing: 5) {
            Image(systemName: source == .metaGlasses ? "glasses" : "iphone")
                .font(.caption2)
            Text(source.rawValue)
                .font(.caption2.weight(.medium))
        }
        .foregroundStyle(.white.opacity(0.7))
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Capsule().fill(Color.white.opacity(0.1)))
    }
}
