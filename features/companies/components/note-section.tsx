import type { Company, Note } from "@/services/types";
import { WEB_MULTILINE_STYLE, iconSizes, spacing } from "@/theme";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  IconButton,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

interface NoteForm {
  visible: boolean;
  setVisible: (v: boolean) => void;
  content: string;
  setContent: (v: string) => void;
  reset: () => void;
}

interface NoteSectionProps {
  company: Company;
  noteForm: NoteForm;
  handleAddNote: () => void;
  handleDeleteNote: (noteId: number) => void;
}

export function NoteSection({
  company,
  noteForm,
  handleAddNote,
  handleDeleteNote,
}: NoteSectionProps) {
  const theme = useTheme();
  return (
    <>
      <SectionHeader
        title={`NOTES (${company.notes?.length ?? 0})`}
        onAdd={() => noteForm.setVisible(!noteForm.visible)}
      />
      {noteForm.visible ? (
        <InlineFormCard>
          <TextInput
            label="Note"
            value={noteForm.content}
            onChangeText={noteForm.setContent}
            mode="outlined"
            multiline
            contentStyle={WEB_MULTILINE_STYLE}
          />
          <FormActions
            onCancel={() => noteForm.setVisible(false)}
            onSubmit={handleAddNote}
            submitLabel="Add"
            disabled={!noteForm.content.trim()}
          />
        </InlineFormCard>
      ) : null}
      {company.notes?.map((note: Note) => (
        <Card key={note.id} style={styles.noteCard} mode="outlined">
          <Card.Content style={styles.noteContent}>
            <View style={styles.noteHeader}>
              <Text variant="bodySmall" style={styles.flex}>
                {note.content}
              </Text>
              <IconButton
                icon="delete-outline"
                size={iconSizes.sm}
                onPress={() => handleDeleteNote(note.id)}
                style={styles.noteDelete}
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
  flex: { flex: 1 },
  noteCard: {
    marginBottom: spacing.xs,
    borderRadius: 10,
    borderCurve: "continuous",
  },
  noteContent: { paddingVertical: spacing.sm },
  noteHeader: { flexDirection: "row", alignItems: "flex-start" },
  noteDelete: { margin: -8 },
});
