import SwiftUI
import AVFoundation
import SwiftData

struct LiveView: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.modelContext) private var modelContext

    // Injected services
    let glassesService: MetaGlassesService
    let voiceEngine: VoiceResponseEngine

    @StateObject private var locationService: LocationContextService
    @StateObject private var liveVM: LiveViewModel
    @StateObject private var captureSession = CaptureSessionManager()

    init(glassesService: MetaGlassesService, voiceEngine: VoiceResponseEngine) {
        self.glassesService = glassesService
        self.voiceEngine    = voiceEngine
        let loc = LocationContextService(enabled: false)
        _locationService = StateObject(wrappedValue: loc)
        _liveVM = StateObject(wrappedValue: LiveViewModel(
            glassesService: glassesService,
            voiceEngine: voiceEngine,
            locationService: loc,
            appState: AppState()
        ))
    }

    var body: some View {
        ZStack {
            cameraLayer
            overlayLayer
        }
        .ignoresSafeArea()
        .onAppear {
            liveVM.setModelContext(modelContext)
            captureSession.configure()
        }
        .onDisappear {
            if liveVM.isSessionActive { liveVM.stopSession() }
        }
    }

    // MARK: - Camera layer

    @ViewBuilder
    private var cameraLayer: some View {
        if appState.isMockMode || liveVM.cameraSource == .metaGlasses {
            // Mock / glasses mode: show dark gradient instead of live camera
            LinearGradient(
                colors: [Color(hex: "0A1628"), Color(hex: "040D18")],
                startPoint: .top, endPoint: .bottom
            )
            .ignoresSafeArea()
        } else {
            CameraPreviewView(session: captureSession.session)
                .ignoresSafeArea()
        }
    }

    // MARK: - Overlay

    private var overlayLayer: some View {
        VStack(spacing: 0) {
            topBar
            Spacer()
            if liveVM.isSessionActive {
                observationsPanel
            } else {
                idlePrompt
            }
            waveformBar
            startStopButton
                .padding(.bottom, 110)
        }
    }

    private var topBar: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("Insight Glass")
                    .font(.headline.bold())
                    .foregroundStyle(.white)
                HStack(spacing: 6) {
                    CameraSourceBadge(source: liveVM.cameraSource)
                    if appState.isMockMode {
                        Text("DEMO")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundStyle(.orange)
                            .padding(.horizontal, 6).padding(.vertical, 2)
                            .background(Capsule().fill(Color.orange.opacity(0.15)))
                    }
                }
            }
            Spacer()
            ConnectionStatusBadge(state: glassesService.state)
        }
        .padding(.horizontal, 20)
        .padding(.top, 56)
    }

    private var observationsPanel: some View {
        ScrollView {
            VStack(spacing: 10) {
                if liveVM.allDisplayObservations.isEmpty {
                    GlassmorphicCard {
                        HStack {
                            ProgressView().tint(.cyan)
                            Text("Analyzing…")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                        .padding(16)
                    }
                    .padding(.horizontal, 16)
                } else {
                    ForEach(liveVM.allDisplayObservations, id: \.id) { obs in
                        ObservationCard(observation: obs)
                            .padding(.horizontal, 16)
                            .transition(.asymmetric(
                                insertion: .move(edge: .bottom).combined(with: .opacity),
                                removal: .opacity
                            ))
                    }
                }
            }
            .padding(.bottom, 12)
            .animation(.spring(response: 0.4), value: liveVM.allDisplayObservations.count)
        }
        .frame(maxHeight: 320)
    }

    private var idlePrompt: some View {
        GlassmorphicCard {
            VStack(spacing: 14) {
                Image(systemName: "eye.circle")
                    .font(.system(size: 44, weight: .ultraLight))
                    .foregroundStyle(LinearGradient(
                        colors: [.cyan, .blue],
                        startPoint: .topLeading, endPoint: .bottomTrailing
                    ))
                Text("Ready to Observe")
                    .font(.title3.bold())
                    .foregroundStyle(.white)
                Text("Tap the button below to begin a session.\nAll observations are speculative and non-diagnostic.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding(24)
        }
        .padding(.horizontal, 24)
    }

    private var waveformBar: some View {
        Group {
            if liveVM.isSessionActive {
                GlassmorphicCard(cornerRadius: 16) {
                    AudioWaveformView(levels: captureSession.waveformLevels)
                        .frame(height: 48)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 12)
                .transition(.opacity)
            }
        }
    }

    private var startStopButton: some View {
        Button {
            if liveVM.isSessionActive {
                liveVM.stopSession()
            } else {
                liveVM.startSession()
            }
        } label: {
            HStack(spacing: 10) {
                if liveVM.isSessionActive {
                    PulsingCircle(color: .red, size: 10)
                    Text("Stop Session")
                        .font(.headline)
                        .foregroundStyle(.white)
                } else {
                    Image(systemName: "play.fill")
                        .font(.headline)
                    Text("Start Session")
                        .font(.headline)
                }
            }
            .foregroundStyle(liveVM.isSessionActive ? .white : .black)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(
                        liveVM.isSessionActive
                            ? AnyShapeStyle(Color.red.opacity(0.85))
                            : AnyShapeStyle(LinearGradient(
                                colors: [.cyan, .blue.opacity(0.9)],
                                startPoint: .leading, endPoint: .trailing
                            ))
                    )
            )
        }
        .padding(.horizontal, 24)
        .padding(.bottom, 12)
    }
}

// MARK: - Observation card

struct ObservationCard: View {
    let observation: EmotionObservation
    @State private var appeared = false

    var body: some View {
        GlassmorphicCard {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: observation.category.iconName)
                    .font(.subheadline)
                    .foregroundStyle(categoryColor)
                    .frame(width: 20)
                    .padding(.top, 2)

                VStack(alignment: .leading, spacing: 6) {
                    Text(observation.observationText)
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.9))
                        .fixedSize(horizontal: false, vertical: true)

                    HStack {
                        Text(observation.category.rawValue)
                            .font(.caption2)
                            .foregroundStyle(categoryColor.opacity(0.7))
                        Spacer()
                        ConfidenceMeterView(confidence: observation.confidenceLevel, compact: true)
                    }
                }
            }
            .padding(14)
        }
        .opacity(appeared ? 1 : 0)
        .offset(y: appeared ? 0 : 8)
        .onAppear {
            withAnimation(.spring(response: 0.4)) { appeared = true }
        }
    }

    private var categoryColor: Color {
        switch observation.category {
        case .visual:          return .cyan
        case .vocal:           return .purple
        case .conversational:  return .green
        case .environmental:   return .orange
        case .composite:       return .blue
        }
    }
}

// MARK: - Camera session manager

final class CaptureSessionManager: ObservableObject {
    let session = AVCaptureSession()
    @Published var waveformLevels: [Float] = Array(repeating: 0.1, count: 40)

    private var videoOutput: AVCaptureVideoDataOutput?
    private var frameProcessor: ((CVPixelBuffer) -> Void)?
    private var audioLevelTimer: Timer?

    func configure() {
        guard session.inputs.isEmpty else { return }
        session.beginConfiguration()
        session.sessionPreset = .medium

        if let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front),
           let input = try? AVCaptureDeviceInput(device: device),
           session.canAddInput(input) {
            session.addInput(input)
        }

        let output = AVCaptureVideoDataOutput()
        output.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32BGRA)]
        if session.canAddOutput(output) { session.addOutput(output) }
        videoOutput = output

        session.commitConfiguration()
        DispatchQueue.global(qos: .background).async { [weak self] in
            self?.session.startRunning()
        }

        // Simulate waveform animation for demo
        audioLevelTimer = Timer.scheduledTimer(withTimeInterval: 0.08, repeats: true) { [weak self] _ in
            guard let self else { return }
            var updated = self.waveformLevels
            updated.removeFirst()
            updated.append(Float.random(in: 0.05...0.75))
            self.waveformLevels = updated
        }
    }

    func setFrameProcessor(_ handler: @escaping (CVPixelBuffer) -> Void) {
        frameProcessor = handler
    }
}
