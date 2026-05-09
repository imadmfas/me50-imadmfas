import SwiftUI
import AVFoundation

// MARK: - UIKit camera preview wrapper

struct CameraPreviewView: UIViewRepresentable {
    let session: AVCaptureSession

    func makeUIView(context: Context) -> PreviewUIView {
        let view = PreviewUIView()
        view.session = session
        return view
    }

    func updateUIView(_ uiView: PreviewUIView, context: Context) {}

    final class PreviewUIView: UIView {
        override class var layerClass: AnyClass { AVCaptureVideoPreviewLayer.self }

        var previewLayer: AVCaptureVideoPreviewLayer {
            layer as! AVCaptureVideoPreviewLayer
        }

        var session: AVCaptureSession? {
            didSet {
                previewLayer.session = session
                previewLayer.videoGravity = .resizeAspectFill
            }
        }
    }
}

// MARK: - Scanning overlay

struct ScanningOverlay: View {
    @State private var scanLineY: CGFloat = 0
    @State private var cornerOpacity: Double = 0.4
    var isActive: Bool = true

    var body: some View {
        GeometryReader { geo in
            ZStack {
                // Corner brackets
                CornerBrackets()
                    .opacity(isActive ? 1.0 : 0.3)

                // Animated scan line
                if isActive {
                    Rectangle()
                        .fill(
                            LinearGradient(
                                colors: [.clear, .cyan.opacity(0.6), .clear],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(height: 2)
                        .offset(y: scanLineY - geo.size.height / 2)
                        .onAppear {
                            withAnimation(
                                .linear(duration: 2.5)
                                .repeatForever(autoreverses: true)
                            ) {
                                scanLineY = geo.size.height
                            }
                        }
                }
            }
        }
    }
}

struct CornerBrackets: View {
    var color: Color = .cyan
    var size: CGFloat = 28
    var lineWidth: CGFloat = 2.5

    var body: some View {
        ZStack {
            // Top-left
            bracket(rotation: 0)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                .padding(24)
            // Top-right
            bracket(rotation: 90)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
                .padding(24)
            // Bottom-left
            bracket(rotation: 270)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
                .padding(24)
            // Bottom-right
            bracket(rotation: 180)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
                .padding(24)
        }
    }

    private func bracket(rotation: Double) -> some View {
        Path { p in
            p.move(to: CGPoint(x: 0, y: size))
            p.addLine(to: CGPoint(x: 0, y: 0))
            p.addLine(to: CGPoint(x: size, y: 0))
        }
        .stroke(color, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
        .frame(width: size, height: size)
        .rotationEffect(.degrees(rotation))
    }
}
