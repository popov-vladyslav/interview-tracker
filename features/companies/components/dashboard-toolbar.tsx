import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { Chip, IconButton, Searchbar, useTheme } from "react-native-paper";
import type { Company } from "@/services/types";
import { spacing } from "@/theme";

type Panel = "search" | "stages" | null;

interface Props {
  companies: Company[];
  search: string;
  onSearchChange: (q: string) => void;
  selectedStage: string | null;
  onStageSelect: (s: string | null) => void;
}

export function DashboardToolbar({
  companies,
  search,
  onSearchChange,
  selectedStage,
  onStageSelect,
}: Props) {
  const theme = useTheme();
  const [activePanel, setActivePanel] = useState<Panel>(null);

  const toggle = useCallback((panel: Panel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  }, []);

  const { stageCounts, stages } = useMemo(() => {
    const counts = companies.reduce<Record<string, number>>((acc, c) => {
      acc[c.stage] = (acc[c.stage] ?? 0) + 1;
      return acc;
    }, {});
    return { stageCounts: counts, stages: Object.keys(counts).sort() };
  }, [companies]);

  const hasSearch = search.trim().length > 0;
  const hasStage = selectedStage !== null;

  return (
    <Animated.View layout={LinearTransition.duration(200)} style={styles.wrapper}>
      {/* Icon row */}
      <View style={styles.iconRow}>
        <IconButton
          icon="magnify"
          mode={activePanel === "search" || hasSearch ? "contained" : "contained-tonal"}
          containerColor={
            activePanel === "search" || hasSearch
              ? theme.colors.primaryContainer
              : theme.colors.surfaceVariant
          }
          iconColor={
            activePanel === "search" || hasSearch
              ? theme.colors.primary
              : theme.colors.onSurfaceVariant
          }
          size={22}
          onPress={() => toggle("search")}
        />
        <IconButton
          icon="filter-variant"
          mode={activePanel === "stages" || hasStage ? "contained" : "contained-tonal"}
          containerColor={
            activePanel === "stages" || hasStage
              ? theme.colors.primaryContainer
              : theme.colors.surfaceVariant
          }
          iconColor={
            activePanel === "stages" || hasStage
              ? theme.colors.primary
              : theme.colors.onSurfaceVariant
          }
          size={22}
          onPress={() => toggle("stages")}
        />
      </View>

      {/* Expandable panels */}
      {activePanel === "search" && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.panel}
        >
          <Searchbar
            placeholder="Search companies or roles..."
            value={search}
            onChangeText={onSearchChange}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
            elevation={0}
            autoFocus
          />
        </Animated.View>
      )}

      {activePanel === "stages" && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.panel}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}
          >
            <Chip
              selected={selectedStage === null}
              onPress={() => onStageSelect(null)}
              compact
            >
              All ({companies.length})
            </Chip>
            {stages.map((stage) => (
              <Chip
                key={stage}
                selected={selectedStage === stage}
                onPress={() =>
                  onStageSelect(selectedStage === stage ? null : stage)
                }
                compact
              >
                {stage} ({stageCounts[stage]})
              </Chip>
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  iconRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  panel: {
    marginTop: spacing.sm,
  },
  searchbar: {
    borderRadius: 12,
  },
  searchInput: {
    fontSize: 14,
  },
  chipScroll: {
    gap: spacing.xs,
    alignItems: "center",
    paddingRight: spacing.md,
  },
});
