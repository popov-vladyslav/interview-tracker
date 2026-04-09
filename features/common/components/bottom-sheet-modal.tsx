import { spacing } from "@/theme";
import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

interface BottomSheetModalProps {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  maxHeight?: number | `${number}%`;
  children: React.ReactNode;
}

export function BottomSheetModal({
  visible,
  onDismiss,
  title,
  maxHeight,
  children,
}: BottomSheetModalProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <View />
      </Pressable>
      <View
        style={[
          styles.sheet,
          { backgroundColor: theme.colors.surface },
          maxHeight != null && { maxHeight },
        ]}
      >
        <View style={styles.sheetHandle}>
          <View
            style={[styles.handle, { backgroundColor: theme.colors.outlineVariant }]}
          />
        </View>
        {title != null && (
          <Text variant="titleMedium" style={styles.sheetTitle}>
            {title}
          </Text>
        )}
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
  },
  sheetHandle: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetTitle: {
    fontWeight: "600",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
});
