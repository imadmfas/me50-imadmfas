import Foundation
import Vision
import CoreImage
import Combine
import AVFoundation

/// Runs Vision-based analysis on camera frames and produces probabilistic
/// EmotionObservation values. Results are framed as speculative observations —
/// never diagnoses or factual claims.
final class EmotionObservationEngine: ObservableObject {
    @Published private(set) var latestObservations: [EmotionObservation] = []

    private let sessionID: UUID
    private var requestQueue = DispatchQueue(label: "com.insightglass.vision", qos: .userInitiated)

    init(sessionID: UUID) {
        self.sessionID = sessionID
    }

    // MARK: - Frame analysis

    func analyze(pixelBuffer: CVPixelBuffer, locationContext: LocationContext?) {
        requestQueue.async { [weak self] in
            guard let self else { return }
            let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, options: [:])
            var collected: [EmotionObservation] = []

            // Face landmarks
            let faceRequest = VNDetectFaceLandmarksRequest()
            // Face capture quality
            let qualityRequest = VNDetectFaceRectanglesRequest()

            do {
                try handler.perform([faceRequest, qualityRequest])
            } catch {
                return
            }

            if let faceObs = faceRequest.results, !faceObs.isEmpty {
                collected += self.interpretFaceLandmarks(faceObs, sessionID: self.sessionID)
            }

            if let context = locationContext, let text = context.conversationalInfluence {
                collected.append(EmotionObservation(
                    observationText: text,
                    confidenceLevel: 0.4,
                    category: .environmental,
                    sessionID: self.sessionID,
                    locationContextLabel: context.label.rawValue
                ))
            }

            DispatchQueue.main.async {
                self.latestObservations = collected
            }
        }
    }

    // MARK: - Mock frame analysis (simulator / demo)

    func analyzeMock(locationContext: LocationContext?) {
        let pool = mockObservations(sessionID: sessionID)
        let sample = Array(pool.shuffled().prefix(Int.random(in: 2...4)))
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
            self.latestObservations = sample
        }
    }

    // MARK: - Vision interpretation helpers

    private func interpretFaceLandmarks(
        _ observations: [VNFaceObservation],
        sessionID: UUID
    ) -> [EmotionObservation] {
        var results: [EmotionObservation] = []
        guard let face = observations.first else { return results }

        // Brow position as tension proxy
        if let landmarks = face.landmarks {
            let hasBrowTension = analyzeBrowPosition(landmarks)
            if hasBrowTension {
                results.append(EmotionObservation(
                    observationText: "There may be signs of concentration or tension in the facial expression.",
                    confidenceLevel: Double.random(in: 0.35...0.65),
                    category: .visual,
                    sessionID: sessionID
                ))
            }

            let eyeOpenness = analyzeEyeOpenness(landmarks)
            switch eyeOpenness {
            case .low:
                results.append(EmotionObservation(
                    observationText: "The person may appear tired or drowsy.",
                    confidenceLevel: Double.random(in: 0.4...0.7),
                    category: .visual,
                    sessionID: sessionID
                ))
            case .high:
                results.append(EmotionObservation(
                    observationText: "The person may appear alert and engaged.",
                    confidenceLevel: Double.random(in: 0.4...0.65),
                    category: .visual,
                    sessionID: sessionID
                ))
            case .normal:
                break
            }

            if analyzeMouthCurvature(landmarks) {
                results.append(EmotionObservation(
                    observationText: "There may be a hint of warmth or openness in the expression.",
                    confidenceLevel: Double.random(in: 0.3...0.6),
                    category: .visual,
                    sessionID: sessionID
                ))
            }
        }

        // Head tilt as engagement indicator
        let roll = face.roll?.doubleValue ?? 0
        if abs(roll) > 0.2 {
            results.append(EmotionObservation(
                observationText: "A slight head tilt may suggest curiosity or attentiveness.",
                confidenceLevel: Double.random(in: 0.25...0.5),
                category: .visual,
                sessionID: sessionID
            ))
        }

        // Low confidence / face too small
        if face.confidence < 0.5 {
            results.append(EmotionObservation(
                observationText: "Visual data is limited — observations may be less reliable at this distance.",
                confidenceLevel: 0.2,
                category: .visual,
                sessionID: sessionID
            ))
        }

        return results
    }

    private enum EyeOpenness { case low, normal, high }

    private func analyzeBrowPosition(_ landmarks: VNFaceLandmarks2D) -> Bool {
        guard let leftBrow = landmarks.leftEyebrow,
              let rightBrow = landmarks.rightEyebrow,
              let leftEye = landmarks.leftEye,
              let rightEye = landmarks.rightEye else { return false }
        let leftBrowY  = leftBrow.normalizedPoints.map(\.y).reduce(0, +) / Double(leftBrow.pointCount)
        let rightBrowY = rightBrow.normalizedPoints.map(\.y).reduce(0, +) / Double(rightBrow.pointCount)
        let leftEyeY   = leftEye.normalizedPoints.map(\.y).reduce(0, +) / Double(leftEye.pointCount)
        let rightEyeY  = rightEye.normalizedPoints.map(\.y).reduce(0, +) / Double(rightEye.pointCount)
        let gap = ((leftBrowY - leftEyeY) + (rightBrowY - rightEyeY)) / 2
        return gap < 0.04
    }

    private func analyzeEyeOpenness(_ landmarks: VNFaceLandmarks2D) -> EyeOpenness {
        guard let leftEye = landmarks.leftEye, let rightEye = landmarks.rightEye else { return .normal }
        let leftH  = eyeHeight(leftEye.normalizedPoints)
        let rightH = eyeHeight(rightEye.normalizedPoints)
        let avg = (leftH + rightH) / 2
        if avg < 0.018 { return .low }
        if avg > 0.045 { return .high }
        return .normal
    }

    private func eyeHeight(_ pts: [CGPoint]) -> Double {
        guard !pts.isEmpty else { return 0 }
        let ys = pts.map(\.y)
        return (ys.max() ?? 0) - (ys.min() ?? 0)
    }

    private func analyzeMouthCurvature(_ landmarks: VNFaceLandmarks2D) -> Bool {
        guard let outerLips = landmarks.outerLips else { return false }
        let pts = outerLips.normalizedPoints
        guard pts.count >= 4 else { return false }
        let leftCorner = pts.min(by: { $0.x < $1.x })!
        let rightCorner = pts.max(by: { $0.x < $1.x })!
        let centerBottom = pts.max(by: { $0.y < $1.y })!
        return centerBottom.y > leftCorner.y && centerBottom.y > rightCorner.y
    }

    // MARK: - Mock data

    static func mockObservations(sessionID: UUID) -> [EmotionObservation] {
        [
            EmotionObservation(observationText: "The person may appear mentally fatigued or carrying a heavy thought.",
                               confidenceLevel: 0.62, category: .visual, sessionID: sessionID),
            EmotionObservation(observationText: "There may be subtle signs of stress or internal preoccupation.",
                               confidenceLevel: 0.55, category: .visual, sessionID: sessionID),
            EmotionObservation(observationText: "A calm, supportive conversation may be appreciated right now.",
                               confidenceLevel: 0.7, category: .conversational, sessionID: sessionID),
            EmotionObservation(observationText: "The person may appreciate being listened to rather than advised.",
                               confidenceLevel: 0.58, category: .conversational, sessionID: sessionID),
            EmotionObservation(observationText: "The voice tone may suggest some emotional pressure.",
                               confidenceLevel: 0.5, category: .vocal, sessionID: sessionID),
            EmotionObservation(observationText: "There may be a hint of warmth — the person may be open to connection.",
                               confidenceLevel: 0.45, category: .visual, sessionID: sessionID),
            EmotionObservation(observationText: "The person may seem engaged but perhaps slightly distracted.",
                               confidenceLevel: 0.48, category: .composite, sessionID: sessionID),
            EmotionObservation(observationText: "You may want to ask how their day is going.",
                               confidenceLevel: 0.75, category: .conversational, sessionID: sessionID),
        ]
    }
}
