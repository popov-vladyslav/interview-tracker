import type {
  Company,
  CreateCompanyPayload,
  Source,
  Status,
  WorkMode,
} from "@/services/types";
import {
  DEFAULT_STAGES,
  SOURCES,
  STATUSES,
  WORK_MODES,
} from "@/services/types";
import { spacing } from "@/theme";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, HelperText, TextInput, useTheme } from "react-native-paper";
import { SelectField } from "./select-field";

interface Props {
  initialData?: Company;
  onSubmit: (payload: CreateCompanyPayload) => Promise<void>;
  submitLabel: string;
}

export function CompanyForm({ initialData, onSubmit, submitLabel }: Props) {
  const theme = useTheme();
  const router = useRouter();

  const [name, setName] = useState(initialData?.name ?? "");
  const [role, setRole] = useState(initialData?.role ?? "");
  const [status, setStatus] = useState<Status>(initialData?.status ?? "Wishlist");
  const [stage, setStage] = useState(initialData?.stage ?? "CV Review");
  const [workMode, setWorkMode] = useState<WorkMode>(
    initialData?.work_mode ?? "Remote",
  );
  const [source, setSource] = useState<Source>(initialData?.source ?? "Other");
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [salary, setSalary] = useState(initialData?.salary ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stage options: from the company's own stages (editing) or defaults (creating)
  const stageOptions = useMemo(() => {
    if (initialData?.stages?.length) {
      return initialData.stages.map((s) => s.name);
    }
    return [...DEFAULT_STAGES];
  }, [initialData]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        role: role.trim(),
        status,
        stage,
        work_mode: workMode,
        source,
        location: location.trim(),
        salary: salary.trim(),
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {error && (
          <HelperText type="error" visible>
            {error}
          </HelperText>
        )}

        <TextInput
          label="Company Name *"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Role / Position"
          value={role}
          onChangeText={setRole}
          mode="outlined"
          style={styles.input}
        />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <SelectField
              label="Status"
              value={status}
              options={STATUSES}
              onSelect={(v) => setStatus(v as Status)}
            />
          </View>
          <View style={styles.halfField}>
            <SelectField
              label="Stage"
              value={stage}
              options={stageOptions}
              onSelect={(v) => setStage(v)}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <SelectField
              label="Work Mode"
              value={workMode}
              options={WORK_MODES}
              onSelect={(v) => setWorkMode(v as WorkMode)}
            />
          </View>
          <View style={styles.halfField}>
            <SelectField
              label="Source"
              value={source}
              options={SOURCES}
              onSelect={(v) => setSource(v as Source)}
            />
          </View>
        </View>

        <TextInput
          label="Location"
          value={location}
          onChangeText={setLocation}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Salary"
          value={salary}
          onChangeText={setSalary}
          mode="outlined"
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting || !name.trim()}
          style={styles.submitButton}
        >
          {submitLabel}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: 40,
  },
  input: {
    backgroundColor: "transparent",
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  halfField: {
    flex: 1,
  },
  submitButton: {
    marginTop: spacing.sm,
    borderRadius: 12,
  },
});
