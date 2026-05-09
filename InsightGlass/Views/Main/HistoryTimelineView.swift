import SwiftUI
import SwiftData

struct HistoryTimelineView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \SessionRecord.startedAt, order: .reverse)
    private var sessions: [SessionRecord]
    @State private var selectedSession: SessionRecord?

    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "061018").ignoresSafeArea()

                if sessions.isEmpty {
                    emptyState
                } else {
                    List {
                        ForEach(sessions, id: \.id) { session in
                            NavigationLink {
                                SessionDetailView(session: session)
                            } label: {
                                SessionRow(session: session)
                            }
                            .listRowBackground(Color.clear)
                            .listRowSeparator(.hidden)
                            .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 4, trailing: 16))
                        }
                        .onDelete(perform: deleteSessions)
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                }
            }
            .navigationTitle("History")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                if !sessions.isEmpty {
                    EditButton()
                        .foregroundStyle(.cyan)
                }
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "clock.arrow.circlepath")
                .font(.system(size: 52, weight: .ultraLight))
                .foregroundStyle(.secondary)
            Text("No sessions yet")
                .font(.headline).foregroundStyle(.secondary)
            Text("Your session history will appear here.")
                .font(.subheadline).foregroundStyle(.tertiary)
        }
    }

    private func deleteSessions(at offsets: IndexSet) {
        for index in offsets {
            let session = sessions[index]
            let sid = session.id
            let obs = (try? modelContext.fetch(
                FetchDescriptor<EmotionObservation>(predicate: #Predicate { $0.sessionID == sid })
            )) ?? []
            obs.forEach { modelContext.delete($0) }
            modelContext.delete(session)
        }
        try? modelContext.save()
    }
}

struct SessionRow: View {
    let session: SessionRecord

    var body: some View {
        GlassmorphicCard(cornerRadius: 16) {
            HStack(spacing: 14) {
                ZStack {
                    Circle().fill(Color.cyan.opacity(0.12)).frame(width: 44, height: 44)
                    Image(systemName: "eye.circle")
                        .font(.title3)
                        .foregroundStyle(.cyan)
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text(session.startedAt.formatted(date: .abbreviated, time: .shortened))
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.white)
                    HStack(spacing: 8) {
                        Label(session.cameraSource.rawValue, systemImage: "video")
                            .font(.caption2).foregroundStyle(.secondary)
                        Text("·").foregroundStyle(.tertiary)
                        Text("\(session.observationCount) observations")
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                }
                Spacer()
                Text(durationString(session.duration))
                    .font(.caption)
                    .foregroundStyle(.tertiary)
                    .monospacedDigit()
            }
            .padding(14)
        }
    }

    private func durationString(_ interval: TimeInterval) -> String {
        let minutes = Int(interval) / 60
        let seconds = Int(interval) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
}

struct SessionDetailView: View {
    let session: SessionRecord
    @Query private var observations: [EmotionObservation]

    init(session: SessionRecord) {
        self.session = session
        let sid = session.id
        _observations = Query(
            filter: #Predicate<EmotionObservation> { $0.sessionID == sid },
            sort: \EmotionObservation.timestamp, order: .reverse
        )
    }

    var body: some View {
        ZStack {
            Color(hex: "061018").ignoresSafeArea()
            List {
                Section("Session Info") {
                    infoRow("Started", value: session.startedAt.formatted())
                    infoRow("Camera", value: session.cameraSource.rawValue)
                    infoRow("Audio", value: session.audioSource.rawValue)
                    infoRow("Observations", value: "\(observations.count)")
                    if let loc = session.locationLabel {
                        infoRow("Location", value: loc)
                    }
                }
                .listRowBackground(Color.white.opacity(0.05))

                if !observations.isEmpty {
                    Section("Observations") {
                        ForEach(observations, id: \.id) { obs in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(obs.observationText)
                                    .font(.subheadline)
                                    .foregroundStyle(.white.opacity(0.88))
                                HStack {
                                    Label(obs.category.rawValue, systemImage: obs.category.iconName)
                                        .font(.caption2)
                                        .foregroundStyle(.secondary)
                                    Spacer()
                                    ConfidenceMeterView(confidence: obs.confidenceLevel, compact: true)
                                }
                            }
                            .padding(.vertical, 4)
                            .listRowBackground(Color.white.opacity(0.04))
                        }
                    }
                }
            }
            .scrollContentBackground(.hidden)
        }
        .navigationTitle("Session")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func infoRow(_ title: String, value: String) -> some View {
        HStack {
            Text(title).foregroundStyle(.secondary).font(.subheadline)
            Spacer()
            Text(value).foregroundStyle(.white).font(.subheadline)
        }
    }
}
