import { DatePickerField } from "@/features/common/components/date-picker-field";
import { useCompaniesStore } from "@/features/companies/store";
import * as companiesApi from "@/services/companies";
import * as contactsApi from "@/services/contacts";
import * as notesApi from "@/services/notes";
import * as stagesApi from "@/services/stages";
import type {
  Company,
  Contact,
  CreateContactPayload,
  CreateNotePayload,
  Note,
  Stage,
  StageStatus,
  UpdateStagePayload,
} from "@/services/types";
import {
  STAGE_STATUS_COLORS,
  STATUS_COLORS,
  WEB_MULTILINE_STYLE,
  spacing,
} from "@/theme";
import { impactMedium, notifyWarning } from "@/utils/haptics";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  List,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const STAGE_STATUS_ICONS: Record<StageStatus, string> = {
  pending: "clock-outline",
  completed: "check-circle",
  cancelled: "close-circle",
};


export default function CompanyDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deleteCompany } = useCompaniesStore();
  const scrollRef = useRef<ScrollView>(null);

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStage, setExpandedStage] = useState<number | null>(null);
  const [snackError, setSnackError] = useState("");

  // Contact form
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Note form
  // Stage form
  const [showStageForm, setShowStageForm] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [addingStage, setAddingStage] = useState(false);

  // Note form
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteContent, setNoteContent] = useState("");

  const loadCompany = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await companiesApi.getCompany(Number(id));
      setCompany(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadCompany();
    }, [loadCompany]),
  );

  const handleDelete = () => {
    notifyWarning();
    const doDelete = async () => {
      try {
        await deleteCompany(Number(id));
        router.back();
      } catch {
        setSnackError("Failed to delete company");
      }
    };

    if (process.env.EXPO_OS === "web") {
      if (confirm("Delete this company and all its data?")) {
        doDelete();
      }
    } else {
      Alert.alert("Delete Company", "Delete this company and all its data?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  const handleStageStatusChange = async (stage: Stage, status: StageStatus) => {
    try {
      await stagesApi.updateStage(stage.id, { status });
      loadCompany();
    } catch {
      setSnackError("Failed to update stage status");
    }
  };

  const handleAddContact = async () => {
    if (!contactName.trim() || !company) return;
    try {
      const payload: CreateContactPayload = {
        name: contactName.trim(),
        role: contactRole.trim(),
        email: contactEmail.trim(),
      };
      await contactsApi.addContact(company.id, payload);
      setContactName("");
      setContactRole("");
      setContactEmail("");
      setShowContactForm(false);
      loadCompany();
    } catch {
      setSnackError("Failed to add contact");
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    try {
      await contactsApi.deleteContact(contactId);
      loadCompany();
    } catch {
      setSnackError("Failed to delete contact");
    }
  };

  const handleAddStage = async () => {
    if (!newStageName.trim() || !company) return;
    setAddingStage(true);
    try {
      await stagesApi.createStage(company.id, newStageName.trim());
      impactMedium();
      setNewStageName("");
      setShowStageForm(false);
      loadCompany();
    } finally {
      setAddingStage(false);
    }
  };

  const handleDeleteStage = async (stageId: number) => {
    notifyWarning();
    const doDelete = async () => {
      await stagesApi.deleteStage(stageId);
      loadCompany();
    };

    if (process.env.EXPO_OS === "web") {
      if (confirm("Delete this stage?")) {
        doDelete();
      }
    } else {
      Alert.alert("Delete Stage", "Delete this stage?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim() || !company) return;
    try {
      const payload: CreateNotePayload = { content: noteContent.trim() };
      await notesApi.addNote(company.id, payload);
      setNoteContent("");
      setShowNoteForm(false);
      loadCompany();
    } catch {
      setSnackError("Failed to add note");
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      await notesApi.deleteNote(noteId);
      loadCompany();
    } catch {
      setSnackError("Failed to delete note");
    }
  };

  if (loading || !company) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const statusColor = STATUS_COLORS[company.status] ?? theme.colors.outline;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Stack.Screen
        options={{
          title: company.name,
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 4 }}>
              <IconButton
                icon="pencil-outline"
                size={22}
                onPress={() => router.push(`/company/${company.id}/edit`)}
              />
              <IconButton
                icon="delete-outline"
                size={22}
                onPress={handleDelete}
              />
            </View>
          ),
        }}
      />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {/* Header */}
        <View style={styles.section}>
          <Text variant="headlineSmall" style={styles.companyName} selectable>
            {company.name}
          </Text>
          {company.role ? (
            <Text
              variant="bodyLarge"
              style={{ color: theme.colors.onSurfaceVariant }}
              selectable
            >
              {company.role}
            </Text>
          ) : null}

          <View style={styles.chipsRow}>
            <Chip
              compact
              style={{ backgroundColor: statusColor + "18" }}
              textStyle={{
                color: statusColor,
                fontWeight: "600",
                fontSize: 12,
              }}
            >
              {company.status}
            </Chip>
            {company.work_mode ? (
              <Chip compact icon="laptop" textStyle={{ fontSize: 12 }}>
                {company.work_mode}
              </Chip>
            ) : null}
            {company.source && company.source !== "Other" ? (
              <Chip compact icon="link-variant" textStyle={{ fontSize: 12 }}>
                {company.source}
              </Chip>
            ) : null}
          </View>

          {company.salary || company.location ? (
            <View style={{ marginTop: spacing.xs }}>
              {company.salary ? (
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                  selectable
                >
                  Salary: {company.salary}
                </Text>
              ) : null}
              {company.location ? (
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                  selectable
                >
                  Location: {company.location}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        <Divider />

        {/* Stages */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              STAGES ({company.stages?.length ?? 0})
            </Text>
            <IconButton
              icon="plus"
              size={18}
              onPress={() => setShowStageForm(!showStageForm)}
            />
          </View>

          {showStageForm && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
            >
              <Card style={styles.formCard} mode="outlined">
                <Card.Content style={styles.formContent}>
                  <TextInput
                    label="Stage Name"
                    value={newStageName}
                    onChangeText={setNewStageName}
                    mode="outlined"
                    dense
                    placeholder="e.g. Phone Screen"
                  />
                  <View style={styles.formActions}>
                    <Button onPress={() => setShowStageForm(false)}>
                      Cancel
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleAddStage}
                      disabled={!newStageName.trim() || addingStage}
                      loading={addingStage}
                    >
                      Add
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </Animated.View>
          )}

          {company.stages?.map((stage) => (
            <StageCard
              key={stage.id}
              stage={stage}
              isExpanded={expandedStage === stage.id}
              canDelete={(company.stages?.length ?? 0) > 1}
              onToggle={() =>
                setExpandedStage(expandedStage === stage.id ? null : stage.id)
              }
              onStatusChange={(s) => handleStageStatusChange(stage, s)}
              onSave={(payload) =>
                stagesApi
                  .updateStage(stage.id, payload)
                  .then(() => loadCompany())
              }
              onDelete={() => handleDeleteStage(stage.id)}
            />
          ))}
        </View>

        <Divider />

        {/* Contacts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              CONTACTS ({company.contacts?.length ?? 0})
            </Text>
            <IconButton
              icon="plus"
              size={18}
              onPress={() => setShowContactForm(!showContactForm)}
            />
          </View>

          {showContactForm && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
            >
              <Card style={styles.formCard} mode="outlined">
                <Card.Content style={styles.formContent}>
                  <TextInput
                    label="Name"
                    value={contactName}
                    onChangeText={setContactName}
                    mode="outlined"
                    dense
                  />
                  <TextInput
                    label="Role"
                    value={contactRole}
                    onChangeText={setContactRole}
                    mode="outlined"
                    dense
                  />
                  <TextInput
                    label="Email"
                    value={contactEmail}
                    onChangeText={setContactEmail}
                    mode="outlined"
                    dense
                    keyboardType="email-address"
                  />
                  <View style={styles.formActions}>
                    <Button onPress={() => setShowContactForm(false)}>
                      Cancel
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleAddContact}
                      disabled={!contactName.trim()}
                    >
                      Add
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </Animated.View>
          )}

          {company.contacts?.map((contact: Contact) => (
            <List.Item
              key={contact.id}
              title={contact.name}
              titleStyle={{ fontSize: 14 }}
              description={[contact.role, contact.email]
                .filter(Boolean)
                .join(" \u00B7 ")}
              descriptionStyle={{ fontSize: 12 }}
              left={(props) => <List.Icon {...props} icon="account" />}
              right={(props) => (
                <IconButton
                  {...props}
                  icon="delete-outline"
                  size={18}
                  onPress={() => handleDeleteContact(contact.id)}
                />
              )}
              style={styles.listItem}
            />
          ))}
        </View>

        <Divider />

        {/* Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              NOTES ({company.notes?.length ?? 0})
            </Text>
            <IconButton
              icon="plus"
              size={18}
              onPress={() => setShowNoteForm(!showNoteForm)}
            />
          </View>

          {showNoteForm && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
            >
              <Card style={styles.formCard} mode="outlined">
                <Card.Content style={styles.formContent}>
                  <TextInput
                    label="Note"
                    value={noteContent}
                    onChangeText={setNoteContent}
                    mode="outlined"
                    multiline
                    contentStyle={WEB_MULTILINE_STYLE}
                  />
                  <View style={styles.formActions}>
                    <Button onPress={() => setShowNoteForm(false)}>
                      Cancel
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleAddNote}
                      disabled={!noteContent.trim()}
                    >
                      Add
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </Animated.View>
          )}

          {company.notes?.map((note: Note) => (
            <Card key={note.id} style={styles.noteCard} mode="outlined">
              <Card.Content style={{ paddingVertical: spacing.sm }}>
                <View style={styles.noteHeader}>
                  <Text variant="bodySmall" style={{ flex: 1 }}>
                    {note.content}
                  </Text>
                  <IconButton
                    icon="delete-outline"
                    size={16}
                    onPress={() => handleDeleteNote(note.id)}
                    style={{ margin: -8 }}
                  />
                </View>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {new Date(note.created_at).toLocaleDateString()}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>

      <Snackbar
        visible={!!snackError}
        onDismiss={() => setSnackError("")}
        duration={4000}
        action={{ label: "Dismiss", onPress: () => setSnackError("") }}
      >
        {snackError}
      </Snackbar>
    </View>
  );
}

// ── Editable Stage Card ──

function StageCard({
  stage,
  isExpanded,
  canDelete,
  onToggle,
  onStatusChange,
  onSave,
  onDelete,
}: {
  stage: Stage;
  isExpanded: boolean;
  canDelete: boolean;
  onToggle: () => void;
  onStatusChange: (s: StageStatus) => void;
  onSave: (payload: UpdateStagePayload) => Promise<void>;
  onDelete: () => void;
}) {
  const stColor = STAGE_STATUS_COLORS[stage.status];

  const [interviewer, setInterviewer] = useState(stage.interviewer);
  const [duration, setDuration] = useState(
    stage.duration ? String(stage.duration) : "",
  );
  const [feedback, setFeedback] = useState(stage.feedback);
  const [myNotes, setMyNotes] = useState(stage.my_notes);
  const [scheduledDate, setScheduledDate] = useState(
    stage.scheduled_date
      ? new Date(stage.scheduled_date).toISOString().split("T")[0]
      : "",
  );
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const markDirty =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
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
            color={stColor}
          />
        )}
        right={() => (
          <StageStatusChip status={stage.status} onChange={onStatusChange} />
        )}
        onPress={onToggle}
        style={styles.listItem}
      />
      {isExpanded && (
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
                style={{ width: 110 }}
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
              {dirty && (
                <Button
                  mode="contained"
                  onPress={handleSave}
                  loading={saving}
                  disabled={saving}
                  compact
                >
                  Save
                </Button>
              )}
            </View>
          </Card.Content>
        </Animated.View>
      )}
    </Card>
  );
}

// ── Stage Status Chip (bottom sheet instead of Menu/Portal) ──

function StageStatusChip({
  status,
  onChange,
}: {
  status: StageStatus;
  onChange: (s: StageStatus) => void;
}) {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();
  const statuses: StageStatus[] = ["pending", "completed", "cancelled"];

  return (
    <>
      <Chip
        compact
        onPress={() => setVisible(true)}
        textStyle={{ fontSize: 11, color: STAGE_STATUS_COLORS[status] }}
        style={{ backgroundColor: STAGE_STATUS_COLORS[status] + "18" }}
      >
        {status}
      </Chip>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
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
            Stage Status
          </Text>
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
                  pressed && {
                    backgroundColor: theme.colors.surfaceVariant,
                  },
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
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
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
  companyName: {
    fontWeight: "700",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
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
  stageActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  formCard: {
    marginBottom: spacing.xs,
    borderRadius: 10,
    borderCurve: "continuous",
  },
  formContent: {
    gap: spacing.xs,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  noteCard: {
    marginBottom: spacing.xs,
    borderRadius: 10,
    borderCurve: "continuous",
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  // Bottom sheet styles
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
