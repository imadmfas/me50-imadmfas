import SwiftUI
import SwiftData

struct AnalysisFeedView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \EmotionObservation.timestamp, order: .reverse)
    private var allObservations: [EmotionObservation]

    @State private var selectedCategory: ObservationCategory? = nil
    @State private var searchText = ""

    private var filtered: [EmotionObservation] {
        allObservations.filter { obs in
            (selectedCategory == nil || obs.category == selectedCategory)
            && (searchText.isEmpty || obs.observationText.localizedCaseInsensitiveContains(searchText))
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "061018").ignoresSafeArea()

                VStack(spacing: 0) {
                    // Category filter chips
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            filterChip(label: "All", icon: "sparkles", category: nil)
                            ForEach(ObservationCategory.allCases, id: \.self) { cat in
                                filterChip(label: cat.rawValue, icon: cat.iconName, category: cat)
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                    }

                    if filtered.isEmpty {
                        emptyState
                    } else {
                        List {
                            ForEach(filtered, id: \.id) { obs in
                                AnalysisRow(observation: obs)
                                    .listRowBackground(Color.clear)
                                    .listRowSeparator(.hidden)
                                    .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 4, trailing: 16))
                            }
                        }
                        .listStyle(.plain)
                        .scrollContentBackground(.hidden)
                    }
                }
            }
            .navigationTitle("Analysis Feed")
            .navigationBarTitleDisplayMode(.large)
            .searchable(text: $searchText, prompt: "Search observations")
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "waveform.path.ecg")
                .font(.system(size: 48, weight: .ultraLight))
                .foregroundStyle(.secondary)
            Text("No observations yet")
                .font(.headline)
                .foregroundStyle(.secondary)
            Text("Start a live session to generate observations.")
                .font(.subheadline)
                .foregroundStyle(.tertiary)
                .multilineTextAlignment(.center)
            Spacer()
        }
        .padding()
    }

    private func filterChip(label: String, icon: String, category: ObservationCategory?) -> some View {
        let isSelected = selectedCategory == category
        return Button {
            withAnimation(.spring(response: 0.3)) {
                selectedCategory = isSelected ? nil : category
            }
        } label: {
            HStack(spacing: 5) {
                Image(systemName: icon).font(.caption2)
                Text(label).font(.caption.weight(isSelected ? .semibold : .regular))
            }
            .foregroundStyle(isSelected ? .black : .white.opacity(0.6))
            .padding(.horizontal, 12)
            .padding(.vertical, 7)
            .background(
                Capsule().fill(isSelected ? Color.cyan : Color.white.opacity(0.1))
            )
        }
    }
}

struct AnalysisRow: View {
    let observation: EmotionObservation

    private var categoryColor: Color {
        switch observation.category {
        case .visual:          return .cyan
        case .vocal:           return .purple
        case .conversational:  return .green
        case .environmental:   return .orange
        case .composite:       return .blue
        }
    }

    var body: some View {
        GlassmorphicCard(cornerRadius: 16) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .top) {
                    Label(observation.category.rawValue, systemImage: observation.category.iconName)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(categoryColor)
                    Spacer()
                    Text(observation.timestamp, style: .relative)
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
                Text(observation.observationText)
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.88))
                    .fixedSize(horizontal: false, vertical: true)
                ConfidenceMeterView(confidence: observation.confidenceLevel)
            }
            .padding(14)
        }
    }
}
