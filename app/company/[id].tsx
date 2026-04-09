import { ContactSection } from "@/features/companies/components/contact-section";
import { NoteSection } from "@/features/companies/components/note-section";
import { StageSection } from "@/features/companies/components/stage-section";
import { LoadingScreen } from "@/features/common/components/loading-screen";
import { useCompanyDetail } from "@/features/companies/hooks/useCompanyDetail";
import { SNACKBAR_DURATION, STATUS_COLORS, iconSizes, spacing } from "@/theme";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Chip,
  Divider,
  IconButton,
  Snackbar,
  Text,
  useTheme,
} from "react-native-paper";

export default function CompanyDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const d = useCompanyDetail(id);

  if (d.loading || !d.company) return <LoadingScreen />;

  const { company } = d;
  const statusColor = STATUS_COLORS[company.status] ?? theme.colors.outline;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Stack.Screen
        options={{
          title: company.name,
          headerRight: () => (
            <View style={styles.headerActions}>
              <IconButton
                icon="pencil-outline"
                size={iconSizes.header}
                onPress={() => router.push(`/company/${company.id}/edit`)}
              />
              <IconButton
                icon="delete-outline"
                size={iconSizes.header}
                onPress={d.handleDelete}
              />
            </View>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
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
              style={{ backgroundColor: `${statusColor}18` }}
              textStyle={[styles.statusChipText, { color: statusColor }]}
            >
              {company.status}
            </Chip>
            {company.work_mode ? (
              <Chip compact icon="laptop" textStyle={styles.metaChipText}>
                {company.work_mode}
              </Chip>
            ) : null}
            {company.source && company.source !== "Other" ? (
              <Chip compact icon="link-variant" textStyle={styles.metaChipText}>
                {company.source}
              </Chip>
            ) : null}
          </View>
          {company.salary || company.location ? (
            <View style={styles.metaBlock}>
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

        <View style={styles.section}>
          <StageSection
            company={company}
            stageForm={d.stageForm}
            expandedStage={d.expandedStage}
            setExpandedStage={d.setExpandedStage}
            handleAddStage={d.handleAddStage}
            handleSaveStage={d.handleSaveStage}
            handleStageStatusChange={d.handleStageStatusChange}
            handleDeleteStage={d.handleDeleteStage}
          />
        </View>
        <Divider />

        <View style={styles.section}>
          <ContactSection
            company={company}
            contactForm={d.contactForm}
            handleAddContact={d.handleAddContact}
            handleDeleteContact={d.handleDeleteContact}
          />
        </View>
        <Divider />

        <View style={styles.section}>
          <NoteSection
            company={company}
            noteForm={d.noteForm}
            handleAddNote={d.handleAddNote}
            handleDeleteNote={d.handleDeleteNote}
          />
        </View>
      </ScrollView>
      <Snackbar
        visible={!!d.snackError}
        onDismiss={() => d.setSnackError(null)}
        duration={SNACKBAR_DURATION}
        action={{ label: "Dismiss", onPress: () => d.setSnackError(null) }}
      >
        {d.snackError}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 40 },
  headerActions: { flexDirection: "row", gap: 4 },
  section: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  companyName: { fontWeight: "700" },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  statusChipText: { fontWeight: "600", fontSize: 12 },
  metaChipText: { fontSize: 12 },
  metaBlock: { marginTop: spacing.xs },
});
