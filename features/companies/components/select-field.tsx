import { spacing } from "@/theme";
import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Divider, Text, TextInput, useTheme } from "react-native-paper";

interface Props {
  label: string;
  value: string;
  options: readonly string[];
  onSelect: (value: string) => void;
}

export function SelectField({ label, value, options, onSelect }: Props) {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();

  const open = () => setVisible(true);
  const close = () => setVisible(false);

  return (
    <>
      <View>
        <TextInput
          label={label}
          value={value}
          mode="outlined"
          editable={false}
          right={<TextInput.Icon icon="chevron-down" onPress={open} />}
          style={styles.input}
        />
        <TouchableOpacity
          onPress={open}
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable style={styles.backdrop} onPress={close}>
          <View />
        </Pressable>
        <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.sheetHandle}>
            <View
              style={[
                styles.handle,
                { backgroundColor: theme.colors.outlineVariant },
              ]}
            />
          </View>
          <Text variant="titleMedium" style={styles.sheetTitle}>
            {label}
          </Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            ItemSeparatorComponent={Divider}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onSelect(item);
                  close();
                }}
                style={({ pressed }) => [
                  styles.option,
                  pressed && { backgroundColor: theme.colors.surfaceVariant },
                  item === value && {
                    backgroundColor: theme.colors.primaryContainer,
                  },
                ]}
              >
                <Text
                  variant="bodyLarge"
                  style={
                    item === value
                      ? { color: theme.colors.primary, fontWeight: "600" }
                      : undefined
                  }
                >
                  {item}
                </Text>
                {item === value ? (
                  <Text style={{ color: theme.colors.primary }}>✓</Text>
                ) : null}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "transparent",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "50%",
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
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
});
