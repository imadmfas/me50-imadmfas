import SwiftUI

struct AudioWaveformView: View {
    let levels: [Float]           // 0.0 – 1.0 per bar
    var barColor: Color = .cyan
    var barCount: Int = 40
    var minHeight: CGFloat = 4
    var maxHeight: CGFloat = 48
    var spacing: CGFloat = 3
    var animated: Bool = true

    @State private var animationPhase: Double = 0

    var body: some View {
        HStack(alignment: .center, spacing: spacing) {
            ForEach(0..<min(barCount, levels.count), id: \.self) { index in
                let level = CGFloat(levels[index])
                let height = minHeight + level * (maxHeight - minHeight)
                RoundedRectangle(cornerRadius: 2)
                    .fill(barColor.opacity(0.6 + Double(level) * 0.4))
                    .frame(width: 3, height: height)
                    .animation(
                        animated
                            ? .spring(response: 0.2, dampingFraction: 0.65).delay(Double(index) * 0.01)
                            : .none,
                        value: level
                    )
            }
        }
    }
}

struct PulsingCircle: View {
    var color: Color = .cyan
    var size: CGFloat = 12
    @State private var pulsing = false

    var body: some View {
        Circle()
            .fill(color)
            .frame(width: size, height: size)
            .overlay(
                Circle()
                    .stroke(color.opacity(0.4), lineWidth: 2)
                    .scaleEffect(pulsing ? 2.2 : 1.0)
                    .opacity(pulsing ? 0 : 0.6)
            )
            .onAppear {
                withAnimation(.easeOut(duration: 1.2).repeatForever(autoreverses: false)) {
                    pulsing = true
                }
            }
    }
}
