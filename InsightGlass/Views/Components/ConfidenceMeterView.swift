import SwiftUI

struct ConfidenceMeterView: View {
    let confidence: Double    // 0.0 – 1.0
    var label: String = "Confidence"
    var compact: Bool = false

    private var meterColor: Color {
        switch confidence {
        case 0..<0.35:  return .orange.opacity(0.8)
        case 0.35..<0.6: return .yellow.opacity(0.9)
        default:         return .cyan
        }
    }

    private var confidenceLabel: String {
        switch confidence {
        case 0..<0.35:  return "Low"
        case 0.35..<0.6: return "Moderate"
        default:         return "Reasonable"
        }
    }

    var body: some View {
        if compact {
            compactMeter
        } else {
            fullMeter
        }
    }

    private var fullMeter: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(label)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                Spacer()
                Text(confidenceLabel)
                    .font(.caption2.bold())
                    .foregroundStyle(meterColor)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.white.opacity(0.08))
                        .frame(height: 6)
                    RoundedRectangle(cornerRadius: 4)
                        .fill(
                            LinearGradient(
                                colors: [meterColor.opacity(0.7), meterColor],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: geo.size.width * confidence, height: 6)
                        .animation(.spring(response: 0.5), value: confidence)
                }
            }
            .frame(height: 6)
        }
    }

    private var compactMeter: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(meterColor)
                .frame(width: 6, height: 6)
            Text(String(format: "%.0f%%", confidence * 100))
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }
}
