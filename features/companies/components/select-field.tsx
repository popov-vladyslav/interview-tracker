import { spacing } from "@/theme";
import { BottomSheetModal } from "@/features/common/components/bottom-sheet-modal";
import { useState } from "react";
import {
  FlatList,
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

      <BottomSheetModal
        visible={visible}
        onDismiss={close}
        title={label}
        maxHeight="50%"
      >
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
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "transparent",
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
});
