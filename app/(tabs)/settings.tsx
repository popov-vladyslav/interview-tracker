import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Dialog,
  Divider,
  List,
  Portal,
  Text,
  useTheme,
} from "react-native-paper";
import { useAuthStore } from "@/features/auth/store";
import { notifyWarning } from "@/utils/haptics";
import { spacing } from "@/theme";

export default function SettingsScreen() {
  const theme = useTheme();
  const { user, logout, deleteAccount } = useAuthStore();
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
    } catch {
      setDeleting(false);
      setDeleteDialogVisible(false);
      if (process.env.EXPO_OS === "web") {
        alert("Failed to delete account. Please try again.");
      } else {
        Alert.alert("Error", "Failed to delete account. Please try again.");
      }
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <List.Section>
        <List.Subheader>Account</List.Subheader>
        <List.Item
          title={user?.name || "User"}
          description={user?.email}
          left={(props) => <List.Icon {...props} icon="account-circle" />}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Item
          title="Sign Out"
          titleStyle={{ color: theme.colors.error }}
          left={(props) => (
            <List.Icon {...props} icon="logout" color={theme.colors.error} />
          )}
          onPress={logout}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader style={{ color: theme.colors.error }}>
          Danger Zone
        </List.Subheader>
        <View style={styles.dangerContent}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Permanently delete your account and all associated data including
            interviews, stages, contacts, and notes. This action cannot be undone.
          </Text>
          <Button
            mode="outlined"
            textColor={theme.colors.error}
            style={styles.deleteButton}
            onPress={() => {
              notifyWarning();
              setDeleteDialogVisible(true);
            }}
          >
            Delete Account
          </Button>
        </View>
      </List.Section>

      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Icon icon="alert" color={theme.colors.error} />
          <Dialog.Title style={styles.dialogTitle}>Delete Account</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              This will permanently delete your account and all your data
              including interviews, stages, contacts, and notes.
            </Text>
            <Text variant="bodyMedium" style={styles.dialogWarning}>
              This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button
              textColor={theme.colors.error}
              onPress={handleDeleteAccount}
              loading={deleting}
              disabled={deleting}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dangerContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  deleteButton: {
    borderColor: "#DC2626",
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  dialogTitle: {
    textAlign: "center",
  },
  dialogWarning: {
    fontWeight: "600",
    marginTop: spacing.sm,
  },
});
