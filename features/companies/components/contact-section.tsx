import type { Company, Contact } from "@/services/types";
import { iconSizes, spacing } from "@/theme";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  IconButton,
  List,
  Text,
  TextInput,
} from "react-native-paper";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

interface ContactForm {
  visible: boolean;
  setVisible: (v: boolean) => void;
  name: string;
  setName: (v: string) => void;
  role: string;
  setRole: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  reset: () => void;
}

interface ContactSectionProps {
  company: Company;
  contactForm: ContactForm;
  handleAddContact: () => void;
  handleDeleteContact: (contactId: number) => void;
}

export function ContactSection({
  company,
  contactForm,
  handleAddContact,
  handleDeleteContact,
}: ContactSectionProps) {
  return (
    <>
      <SectionHeader
        title={`CONTACTS (${company.contacts?.length ?? 0})`}
        onAdd={() => contactForm.setVisible(!contactForm.visible)}
      />
      {contactForm.visible ? (
        <InlineFormCard>
          <TextInput
            label="Name"
            value={contactForm.name}
            onChangeText={contactForm.setName}
            mode="outlined"
            dense
          />
          <TextInput
            label="Role"
            value={contactForm.role}
            onChangeText={contactForm.setRole}
            mode="outlined"
            dense
          />
          <TextInput
            label="Email"
            value={contactForm.email}
            onChangeText={contactForm.setEmail}
            mode="outlined"
            dense
            keyboardType="email-address"
          />
          <FormActions
            onCancel={() => contactForm.setVisible(false)}
            onSubmit={handleAddContact}
            submitLabel="Add"
            disabled={!contactForm.name.trim()}
          />
        </InlineFormCard>
      ) : null}
      {company.contacts?.map((contact: Contact) => (
        <List.Item
          key={contact.id}
          title={contact.name}
          titleStyle={styles.listTitle}
          description={[contact.role, contact.email].filter(Boolean).join(" · ")}
          descriptionStyle={styles.listDescription}
          left={(props) => <List.Icon {...props} icon="account" />}
          right={(props) => (
            <IconButton
              {...props}
              icon="delete-outline"
              size={iconSizes.md}
              onPress={() => handleDeleteContact(contact.id)}
            />
          )}
          style={styles.listItem}
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
  listItem: { paddingVertical: 0, minHeight: 44 },
  listTitle: { fontSize: 14 },
  listDescription: { fontSize: 12 },
});
