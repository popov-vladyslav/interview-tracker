import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import { spacing } from "@/theme";

interface Props {
  label: string;
  value: string;
  onChange: (dateStr: string) => void;
}

export function DatePickerField({ label, value, onChange }: Props) {
  const theme = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const currentDate = value ? new Date(value) : new Date();
  const displayValue = value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const handleDateChange = (_event: unknown, selectedDate?: Date) => {
    if (process.env.EXPO_OS === "android") {
      setShowPicker(false);
    }
    if (selectedDate) {
      onChange(selectedDate.toISOString().split("T")[0]);
    }
  };

  const handleClear = () => {
    onChange("");
    setShowPicker(false);
  };

  if (process.env.EXPO_OS === "web") {
    return (
      <TextInput
        label={label}
        value={value}
        onChangeText={onChange}
        mode="outlined"
        dense
        placeholder="YYYY-MM-DD"
        style={styles.input}
      />
    );
  }

  return (
    <>
      <View>
        <TextInput
          label={label}
          value={displayValue}
          mode="outlined"
          dense
          editable={false}
          right={
            <TextInput.Icon
              icon="calendar"
              onPress={() => setShowPicker(true)}
            />
          }
          style={styles.input}
        />
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {process.env.EXPO_OS === "ios" ? (
        <Modal
          visible={showPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPicker(false)}
        >
          <Pressable
            style={styles.backdrop}
            onPress={() => setShowPicker(false)}
          >
            <View />
          </Pressable>
          <View
            style={[styles.sheet, { backgroundColor: theme.colors.surface }]}
          >
            <View style={styles.sheetHeader}>
              <Button onPress={handleClear}>Clear</Button>
              <Text variant="titleMedium" style={{ fontWeight: "600" }}>
                {label}
              </Text>
              <Button onPress={() => setShowPicker(false)}>Done</Button>
            </View>
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={currentDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                style={styles.picker}
              />
            </View>
          </View>
        </Modal>
      ) : showPicker ? (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      ) : null}
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
    paddingBottom: 34,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  pickerContainer: {
    alignItems: "center",
  },
  picker: {
    height: 200,
    width: "100%",
  },
});
