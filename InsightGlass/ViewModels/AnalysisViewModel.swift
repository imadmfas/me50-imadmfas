import SwiftUI
import SwiftData
import Combine

@MainActor
final class AnalysisViewModel: ObservableObject {
    @Published var sessions: [SessionRecord] = []
    @Published var selectedSession: SessionRecord?
    @Published var observationsForSelected: [EmotionObservation] = []
    @Published var filterCategory: ObservationCategory? = nil

    private var modelContext: ModelContext?

    func setModelContext(_ ctx: ModelContext) {
        modelContext = ctx
        loadSessions()
    }

    func loadSessions() {
        guard let ctx = modelContext else { return }
        let descriptor = FetchDescriptor<SessionRecord>(
            sortBy: [SortDescriptor(\.startedAt, order: .reverse)]
        )
        sessions = (try? ctx.fetch(descriptor)) ?? []
    }

    func selectSession(_ session: SessionRecord) {
        selectedSession = session
        loadObservations(for: session)
    }

    func loadObservations(for session: SessionRecord) {
        guard let ctx = modelContext else { return }
        var descriptor = FetchDescriptor<EmotionObservation>(
            predicate: #Predicate { $0.sessionID == session.id },
            sortBy: [SortDescriptor(\.timestamp, order: .reverse)]
        )
        let all = (try? ctx.fetch(descriptor)) ?? []
        if let cat = filterCategory {
            observationsForSelected = all.filter { $0.category == cat }
        } else {
            observationsForSelected = all
        }
    }

    func deleteSession(_ session: SessionRecord) {
        guard let ctx = modelContext else { return }
        // Delete associated observations first
        let sid = session.id
        let obsDescriptor = FetchDescriptor<EmotionObservation>(
            predicate: #Predicate { $0.sessionID == sid }
        )
        let obs = (try? ctx.fetch(obsDescriptor)) ?? []
        obs.forEach { ctx.delete($0) }
        ctx.delete(session)
        try? ctx.save()
        loadSessions()
        if selectedSession?.id == session.id {
            selectedSession = nil
            observationsForSelected = []
        }
    }

    var groupedByDate: [(String, [SessionRecord])] {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        let grouped = Dictionary(grouping: sessions) { formatter.string(from: $0.startedAt) }
        return grouped.sorted { $0.key > $1.key }
    }
}
