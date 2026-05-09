# Insight Glass

An experimental personal wellbeing assistant for iPhone, designed to be used with Meta smart glasses.

## Concept

When worn with Meta Ray-Ban smart glasses, Insight Glass uses camera, microphone, optional GPS context, and on-device AI to generate **soft, speculative, non-medical** emotional and conversational observations about the person in front of you.

All outputs are probabilistic — never diagnoses, never facts:
- "The person may appear tired."
- "There may be signs of stress or distraction."
- "A calm supportive conversation may help."

---

## Architecture

```
InsightGlass/
├── App/
│   ├── InsightGlassApp.swift       — @main entry, SwiftData container
│   └── AppState.swift              — Global observable state
│
├── Models/
│   ├── EmotionObservation.swift    — SwiftData model (persisted)
│   ├── AudioPattern.swift          — Transient audio analysis result
│   ├── SessionRecord.swift         — SwiftData model (persisted)
│   ├── LocationContext.swift       — Transient location context
│   └── DeviceConnectionState.swift — Meta glasses state struct
│
├── Services/
│   ├── MetaGlassesService.swift    — CoreBluetooth + Meta SDK wrapper
│   ├── EmotionObservationEngine.swift — Vision framework face analysis
│   ├── AudioPatternAnalyzer.swift  — AVAudioEngine vocal pattern analysis
│   ├── ConversationSupportEngine.swift — Multi-signal synthesis
│   ├── VoiceResponseEngine.swift   — AVSpeechSynthesizer TTS output
│   ├── LocationContextService.swift — CoreLocation optional context
│   └── PrivacyManager.swift        — Permission management + data deletion
│
├── ViewModels/
│   ├── LiveViewModel.swift         — Live session orchestration
│   ├── AnalysisViewModel.swift     — History query + filter
│   ├── DeviceViewModel.swift       — Glasses connection UI state
│   └── SettingsViewModel.swift     — Settings + data deletion
│
├── Views/
│   ├── Onboarding/
│   │   └── DisclaimerView.swift    — Mandatory ethics disclaimer
│   ├── Main/
│   │   ├── ContentView.swift       — Tab container + custom tab bar
│   │   ├── LiveView.swift          — Live camera + analysis overlay
│   │   ├── AnalysisFeedView.swift  — Filterable observation feed
│   │   ├── VoiceControlsView.swift — Response mode picker
│   │   ├── HistoryTimelineView.swift — Session history + detail
│   │   ├── DeviceConnectionView.swift — Meta glasses pairing
│   │   └── PrivacySettingsView.swift  — Permissions + data deletion
│   └── Components/
│       ├── GlassmorphicCard.swift  — Reusable glassmorphism container
│       ├── AudioWaveformView.swift — Animated audio visualizer
│       ├── ConfidenceMeterView.swift — Probability confidence bar
│       ├── ConnectionStatusView.swift — BT status badge
│       └── CameraOverlayView.swift — Camera preview + scan overlay
│
└── Resources/
    └── Info.plist                  — All required permission strings
```

---

## Requirements

| Requirement       | Version          |
|-------------------|------------------|
| iOS               | 17.0+            |
| Xcode             | 15.0+            |
| Swift             | 5.9+             |
| SwiftUI           | Latest           |
| SwiftData         | Included (iOS 17)|

### Frameworks used
- **Vision** — Face landmark detection, brow/eye/mouth analysis
- **CoreML** — On-device model pipeline (extensible)
- **AVFoundation** — Camera, microphone, TTS output
- **CoreBluetooth** — Meta glasses Bluetooth discovery and pairing
- **CoreLocation** — Optional environmental context
- **SwiftData** — Local persistence (sessions + observations)

---

## Setup Instructions

### 1. Open in Xcode
```bash
open InsightGlass.xcodeproj
```

### 2. Set your development team
In Xcode → Project → Signing & Capabilities → Team: select your Apple Developer account.

### 3. Set bundle identifier
Change `com.insightglass.app` to your own reverse-domain identifier.

### 4. Add required capabilities
In Xcode → Target → Signing & Capabilities, add:
- **Background Modes** → Audio, Bluetooth Central

### 5. Build and run on a physical device
The camera and microphone require a real iPhone — the simulator will use mock mode automatically.

---

## Meta Glasses Integration

### What works via Bluetooth
- Device discovery and pairing
- Microphone routing (audio plays through glasses mic when connected)
- Speaker routing (TTS plays through glasses speakers)
- Battery level monitoring

### What requires the Meta SDK
The **Meta Horizon SDK** (for Ray-Ban Stories / Ray-Ban Meta integration) is required for:
- Official pairing flows
- Battery characteristic reads
- Firmware version

### Camera streaming limitation
Direct camera streaming from Meta glasses to a third-party iOS app is **not available via the public Meta SDK** at this time. The app automatically falls back to the iPhone front-facing camera and clearly indicates this in the UI.

When Meta releases an official camera streaming API, replace `MetaGlassesService.isCameraStreamAvailable` with the SDK capability check and feed frames into `LiveViewModel.processFrame(_:)`.

---

## Demo / Mock Mode

Enable **Demo Mode** in the Device tab (or toggle `AppState.isMockMode`) to run the app without camera or microphone access. The app generates realistic sample observations for testing the full UI flow.

---

## Privacy Design

- All analysis is **on-device only**
- No audio or video is stored — only the text of observations
- Sessions and observations are stored in SwiftData locally
- Delete All Data button in Privacy tab wipes everything
- Location context is opt-in and session-scoped only
- Meta glasses recording LED is respected (hardware-enforced)

---

## Ethical Guidelines

This app is built for **supportive personal use only**:

✅ Allowed:
- Supporting empathetic conversations
- Personal communication awareness
- Understanding your own interaction patterns

❌ Not allowed:
- Surveillance without consent
- Psychological profiling
- Medical/psychiatric use
- Law enforcement
- Lie detection

All observations are explicitly framed as speculative possibilities. The app will never present an observation as a fact or diagnosis.

---

## Extending the AI Engine

The `EmotionObservationEngine` uses Apple's `Vision` framework for face analysis. To add a CoreML model:

1. Train or download a `.mlmodel` for facial expression classification
2. Add it to the Xcode project
3. Create a `VNCoreMLRequest` in `EmotionObservationEngine.analyze(pixelBuffer:locationContext:)`
4. Map the model's output labels to `EmotionObservation` instances with appropriate hedging language

---

## License

MIT License. Use responsibly and ethically.
