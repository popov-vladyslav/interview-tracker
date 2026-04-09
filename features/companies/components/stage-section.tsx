import { StageCard } from "@/features/companies/components/stage-card";
import type { Company } from "@/services/types";
import { iconSizes, spacing } from "@/theme";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  IconButton,
  Text,
  TextInput,
} from "react-native-paper";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import type { UpdateStagePayload, Stage, StageStatus } from "@/services/types";

interface StageForm {
  visible: boolean;
  setVisible: (v: boolean) => void;
  name: string;
  setName: (v: string) => void;
  adding: boolean;
  setAdding: (v: boolean) => void;
  reset: () => void;
}

interface StageSectionProps {
  company: Company;
  stageForm: StageForm;
  expandedStage: number | null;
  setExpandedStage: (id: number | null) => void;
  handleAddStage: () => void;
  handleSaveStage: (stageId: number, payload: UpdateStagePayload) => Promise<void>;
  handleStageStatusChange: (stage: Stage, status: StageStatus) => Promise<void>;
  handleDeleteStage: (stageId: number) => void;
}

export function StageSection({
  company,
  stageForm,
  expandedStage,
  setExpandedStage,
  handleAddStage,
  handleSaveStage,
  handleStageStatusChange,
  handleDeleteStage,
}: StageSectionProps) {
  return (
    <>
      <SectionHeader
        title={`STAGES (${company.stages?.length ?? 0})`}
        onAdd={() => stageForm.setVisible(!stageForm.visible)}
      />
      {stageForm.visible ? (
        <InlineFormCard>
          <TextInput
            label="Stage Name"
            value={stageForm.name}
            onChangeText={stageForm.setName}
            mode="outlined"
            dense
            placeholder="e.g. Phone Screen"
          />
          <FormActions
            onCancel={() => stageForm.setVisible(false)}
            onSubmit={handleAddStage}
            submitLabel="Add"
            disabled={!stageForm.name.trim() || stageForm.adding}
            loading={stageForm.adding}
          />
        </InlineFormCard>
      ) : null}
      {company.stages?.map((stage) => (
        <StageCard
          key={stage.id}
          stage={stage}
          isExpanded={expandedStage === stage.id}
          canDelete={(company.stages?.length ?? 0) > 1}
          onToggle={() =>
            setExpandedStage(expandedStage === stage.id ? null : stage.id)
          }
          onStatusChange={(status) => handleStageStatusChange(stage, status)}
          onSave={(payload) => handleSaveStage(stage.id, payload)}
          onDelete={() => handleDeleteStage(stage.id)}
        />
      ))}
    </>
  );
}

function SectionHeader({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text variant="titleSmall" style={styles.sectionTitle}>
        {title}
      </Text>
      <IconButton icon="plus" size={iconSizes.md} onPress={onAdd} />
    </View>
  );
}

function InlineFormCard({ children }: { children: ReactNode }) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
    >
      <Card style={styles.formCard} mode="outlined">
        <Card.Content style={styles.formContent}>{children}</Card.Content>
      </Card>
    </Animated.View>
  );
}

function FormActions({
  onCancel,
  onSubmit,
  submitLabel,
  disabled,
  loading,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <View style={styles.formActions}>
      <Button onPress={onCancel}>Cancel</Button>
      <Button
        mode="contained"
        onPress={onSubmit}
        disabled={disabled}
        loading={loading}
      >
        {submitLabel}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontWeight: "600",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  formCard: {
    marginBottom: spacing.xs,
    borderRadius: 10,
    borderCurve: "continuous",
  },
  formContent: { gap: spacing.xs },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
});
