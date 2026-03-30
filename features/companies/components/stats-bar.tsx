import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Chip } from "react-native-paper";
import type { Company } from "@/services/types";
import { spacing } from "@/theme";

interface Props {
  companies: Company[];
  selectedStage: string | null;
  onSelect: (stage: string | null) => void;
}

export function StatsBar({ companies, selectedStage, onSelect }: Props) {
  const { counts, stages } = useMemo(() => {
    const c = companies.reduce<Record<string, number>>((acc, company) => {
      acc[company.stage] = (acc[company.stage] ?? 0) + 1;
      return acc;
    }, {});
    return { counts: c, stages: Object.keys(c).sort() };
  }, [companies]);

  return (
    <View style={styles.container}>
      <Chip
        selected={selectedStage === null}
        onPress={() => onSelect(null)}
        compact
      >
        All ({companies.length})
      </Chip>
      {stages.map((stage) => (
        <Chip
          key={stage}
          selected={selectedStage === stage}
          onPress={() => onSelect(selectedStage === stage ? null : stage)}
          compact
        >
          {stage} ({counts[stage]})
        </Chip>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.xs,
  },
});
