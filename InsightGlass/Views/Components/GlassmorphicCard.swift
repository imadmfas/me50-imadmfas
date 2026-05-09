import SwiftUI

struct GlassmorphicCard<Content: View>: View {
    let content: Content
    var cornerRadius: CGFloat = 20
    var opacity: Double = 0.12
    var borderOpacity: Double = 0.25

    init(cornerRadius: CGFloat = 20,
         opacity: Double = 0.12,
         borderOpacity: Double = 0.25,
         @ViewBuilder content: () -> Content) {
        self.cornerRadius = cornerRadius
        self.opacity = opacity
        self.borderOpacity = borderOpacity
        self.content = content()
    }

    var body: some View {
        content
            .background(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: cornerRadius)
                            .fill(Color.white.opacity(opacity))
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: cornerRadius)
                            .strokeBorder(
                                LinearGradient(
                                    colors: [.white.opacity(borderOpacity), .clear],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 1
                            )
                    )
            )
    }
}

// MARK: - Shimmer modifier

struct ShimmerModifier: ViewModifier {
    @State private var phase: CGFloat = 0

    func body(content: Content) -> some View {
        content
            .overlay(
                LinearGradient(
                    colors: [.clear,
                             .white.opacity(0.15),
                             .clear],
                    startPoint: .init(x: phase - 0.3, y: 0),
                    endPoint: .init(x: phase, y: 1)
                )
                .allowsHitTesting(false)
            )
            .onAppear {
                withAnimation(.linear(duration: 2.5).repeatForever(autoreverses: false)) {
                    phase = 1.3
                }
            }
    }
}

extension View {
    func shimmer() -> some View {
        modifier(ShimmerModifier())
    }
}
