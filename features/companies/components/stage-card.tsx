import { DatePickerField } from "@/features/common/components/date-picker-field";
import type { Stage, StageStatus, UpdateStagePayload } from "@/services/types";
import { formatDateISO } from "@/features/companies/utils";
import {
  STAGE_STATUS_COLORS,
  WEB_MULTILINE_STYLE,
  spacing,
} from "@/theme";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Card, List, TextInput } from "react-native-paper";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { STAGE_STATUS_ICONS, StageStatusChip } from "./stage-status-chip";

type Props = {
  stage: Stage;
  isExpanded: boolean;
  canDelete: boolean;
  onToggle: () => void;
  onStatusChange: (status: StageStatus) => void;
  onSave: (payload: UpdateStagePayload) => Promise<void>;
  onDelete: () => void;
};

export function StageCard({
  stage,
  isExpanded,
  canDelete,
  onToggle,
  onStatusChange,
  onSave,
  onDelete,
}: Props) {
  const statusColor = STAGE_STATUS_COLORS[stage.status];
  const [interviewer, setInterviewer] = useState(stage.interviewer);
  const [duration, setDuration] = useState(
    stage.duration ? String(stage.duration) : "",
  );
  const [feedback, setFeedback] = useState(stage.feedback);
  const [myNotes, setMyNotes] = useState(stage.my_notes);
  const [scheduledDate, setScheduledDate] = useState(
    stage.scheduled_date ? formatDateISO(stage.scheduled_date) : "",
  );
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const markDirty =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setDirty(true);
    };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        interviewer,
        duration: duration ? Number(duration) : undefined,
        feedback,
        my_notes: myNotes,
        scheduled_date: scheduledDate || undefined,
      });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={styles.stageCard} mode="outlined">
      <List.Item
        title={stage.name}
        titleStyle={{ fontSize: 14 }}
        description={
          stage.scheduled_date
            ? new Date(stage.scheduled_date).toLocaleDateString()
            : undefined
        }
        descriptionStyle={{ fontSize: 12 }}
        left={(props) => (
          <List.Icon
            {...props}
            icon={STAGE_STATUS_ICONS[stage.status]}
            color={statusColor}
          />
        )}
        right={() => (
          <StageStatusChip status={stage.status} onChange={onStatusChange} />
        )}
        onPress={onToggle}
        style={styles.listItem}
      />
      {isExpanded ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
        >
          <Card.Content style={styles.stageDetails}>
            <DatePickerField
              label="Date"
              value={scheduledDate}
              onChange={markDirty(setScheduledDate)}
            />
            <View style={styles.stageRow}>
              <TextInput
                label="Interviewer"
                value={interviewer}
                onChangeText={markDirty(setInterviewer)}
                mode="outlined"
                dense
                style={styles.flex}
              />
              <TextInput
                label="Minutes"
                value={duration}
                onChangeText={markDirty(setDuration)}
                mode="outlined"
                dense
                keyboardType="numeric"
                style={styles.duration}
              />
            </View>
            <TextInput
              label="Feedback"
              value={feedback}
              onChangeText={markDirty(setFeedback)}
              mode="outlined"
              multiline
              contentStyle={WEB_MULTILINE_STYLE}
            />
            <TextInput
              label="My Notes"
              value={myNotes}
              onChangeText={markDirty(setMyNotes)}
              mode="outlined"
              dense
              multiline
              contentStyle={WEB_MULTILINE_STYLE}
            />
            <View style={styles.stageActions}>
              <Button
                icon="delete-outline"
                textColor={STAGE_STATUS_COLORS.cancelled}
                compact
                onPress={onDelete}
                disabled={!canDelete}
              >
                Delete
              </Button>
              {dirty ? (
                <Button
                  mode="contained"
                  onPress={handleSave}
                  loading={saving}
                  disabled={saving}
                  compact
                >
                  Save
                </Button>
              ) : null}
            </View>
          </Card.Content>
        </Animated.View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  listItem: {
    paddingVertical: 0,
    minHeight: 44,
  },
  stageCard: {
    marginBottom: spacing.xs,
    borderRadius: 10,
    borderCurve: "continuous",
  },
  stageDetails: {
    paddingTop: 0,
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  stageRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  duration: {
    width: 110,
  },
  stageActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
