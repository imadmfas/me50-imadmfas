import SwiftUI
import Combine
import AVFoundation
import SwiftData

@MainActor
final class LiveViewModel: ObservableObject {
    // Session state
    @Published var isSessionActive: Bool = false
    @Published var activeSession: SessionRecord?
    @Published var cameraSource: CameraSource = .iphone
    @Published var audioSource: AudioSource = .iphone

    // Analysis results
    @Published var currentObservations: [EmotionObservation] = []
    @Published var compositeObservations: [EmotionObservation] = []
    @Published var allDisplayObservations: [EmotionObservation] = []

    // UI state
    @Published var isMockMode: Bool = false

    private let glassesService: MetaGlassesService
    private let emotionEngine: EmotionObservationEngine
    private let audioAnalyzer: AudioPatternAnalyzer
    private let voiceEngine: VoiceResponseEngine
    private let locationService: LocationContextService
    private var appState: AppState

    private var cancellables = Set<AnyCancellable>()
    private var sessionID: UUID = UUID()
    private var modelContext: ModelContext?

    // How often (seconds) to synthesize & speak composite observations
    private let compositeInterval: TimeInterval = 8

    init(
        glassesService: MetaGlassesService,
        voiceEngine: VoiceResponseEngine,
        locationService: LocationContextService,
        appState: AppState
    ) {
        self.glassesService  = glassesService
        self.voiceEngine     = voiceEngine
        self.locationService = locationService
        self.appState        = appState

        sessionID = UUID()
        emotionEngine = EmotionObservationEngine(sessionID: sessionID)
        audioAnalyzer = AudioPatternAnalyzer(sessionID: sessionID)

        isMockMode = appState.isMockMode
        setupBindings()
    }

    func setModelContext(_ ctx: ModelContext) {
        modelContext = ctx
    }

    // MARK: - Session lifecycle

    func startSession() {
        guard !isSessionActive else { return }
        sessionID = UUID()

        cameraSource = glassesService.isCameraStreamAvailable ? .metaGlasses : .iphone
        audioSource  = glassesService.isMicrophoneAvailable   ? .metaGlasses : .iphone

        let session = SessionRecord(
            id: sessionID,
            cameraSource: cameraSource,
            audioSource: audioSource,
            locationLabel: locationService.currentContext?.label.rawValue
        )
        activeSession = session
        modelContext?.insert(session)

        if isMockMode {
            startMockSession()
        } else {
            audioAnalyzer.startListening()
        }

        isSessionActive = true
    }

    func stopSession() {
        guard isSessionActive else { return }
        audioAnalyzer.stopListening()
        voiceEngine.stopSpeaking()
        mockTimer?.invalidate()
        mockTimer = nil
        activeSession?.endedAt = .now
        try? modelContext?.save()
        activeSession = nil
        isSessionActive = false
        currentObservations = []
        compositeObservations = []
        allDisplayObservations = []
    }

    // MARK: - Frame feed (called from camera layer)

    func processFrame(_ pixelBuffer: CVPixelBuffer) {
        guard isSessionActive, !isMockMode else { return }
        emotionEngine.analyze(pixelBuffer: pixelBuffer,
                              locationContext: locationService.currentContext)
    }

    // MARK: - Mock

    private var mockTimer: Timer?

    private func startMockSession() {
        audioAnalyzer.injectMockPattern()
        emotionEngine.analyzeMock(locationContext: locationService.currentContext)

        mockTimer = Timer.scheduledTimer(withTimeInterval: compositeInterval, repeats: true) { [weak self] _ in
            guard let self else { return }
            Task { @MainActor in
                self.emotionEngine.analyzeMock(locationContext: self.locationService.currentContext)
                self.audioAnalyzer.injectMockPattern()
            }
        }
    }

    // MARK: - Bindings

    private func setupBindings() {
        emotionEngine.$latestObservations
            .combineLatest(audioAnalyzer.$currentPattern)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] visual, audio in
                guard let self, self.isSessionActive else { return }
                self.currentObservations = visual
                let composite = ConversationSupportEngine.synthesize(
                    visualObservations: visual,
                    audioPattern: audio,
                    locationContext: self.locationService.currentContext
                )
                self.compositeObservations = composite

                var audioObs: [EmotionObservation] = []
                if let pattern = audio {
                    audioObs = pattern.observationTexts.map {
                        EmotionObservation(observationText: $0, confidenceLevel: 0.5,
                                          category: .vocal, sessionID: self.sessionID)
                    }
                }

                self.allDisplayObservations = (visual + audioObs + composite)
                    .sorted { $0.confidenceLevel > $1.confidenceLevel }

                self.activeSession?.observationCount = self.allDisplayObservations.count
                self.persistNewObservations(visual + audioObs + composite)

                if self.appState.responseMode != .silent {
                    let topTwo = composite.isEmpty ? Array(visual.prefix(2)) : Array(composite.prefix(1))
                    self.voiceEngine.speakObservations(topTwo, mode: self.appState.responseMode)
                }
            }
            .store(in: &cancellables)
    }

    private func persistNewObservations(_ obs: [EmotionObservation]) {
        guard let ctx = modelContext else { return }
        obs.forEach { ctx.insert($0) }
        try? ctx.save()
    }
}
