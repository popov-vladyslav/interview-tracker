import type { StageStatus } from "@/services/types";
import { STAGE_STATUS_COLORS, spacing } from "@/theme";
import { BottomSheetModal } from "@/features/common/components/bottom-sheet-modal";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Chip, Divider, List, Text, useTheme } from "react-native-paper";

export const STAGE_STATUS_ICONS: Record<StageStatus, string> = {
  pending: "clock-outline",
  completed: "check-circle",
  cancelled: "close-circle",
};

type Props = {
  status: StageStatus;
  onChange: (status: StageStatus) => void;
};

export function StageStatusChip({ status, onChange }: Props) {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();
  const statuses: StageStatus[] = ["pending", "completed", "cancelled"];

  return (
    <>
      <Chip
        compact
        onPress={() => setVisible(true)}
        textStyle={{ fontSize: 11, color: STAGE_STATUS_COLORS[status] }}
        style={{ backgroundColor: `${STAGE_STATUS_COLORS[status]}18` }}
      >
        {status}
      </Chip>

      <BottomSheetModal
        visible={visible}
        onDismiss={() => setVisible(false)}
        title="Stage Status"
      >
        <FlatList
          data={statuses}
          keyExtractor={(item) => item}
          ItemSeparatorComponent={Divider}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                onChange(item);
                setVisible(false);
              }}
              style={({ pressed }) => [
                styles.sheetOption,
                pressed && { backgroundColor: theme.colors.surfaceVariant },
                item === status && {
                  backgroundColor: theme.colors.primaryContainer,
                },
              ]}
            >
              <View style={styles.sheetOptionRow}>
                <List.Icon
                  icon={STAGE_STATUS_ICONS[item]}
                  color={STAGE_STATUS_COLORS[item]}
                />
                <Text
                  variant="bodyLarge"
                  style={
                    item === status
                      ? { color: theme.colors.primary, fontWeight: "600" }
                      : undefined
                  }
                >
                  {item}
                </Text>
              </View>
              {item === status ? (
                <Text style={{ color: theme.colors.primary }}>✓</Text>
              ) : null}
            </Pressable>
          )}
        />
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  sheetOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  sheetOptionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
