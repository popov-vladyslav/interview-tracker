import { memo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Card, Chip, IconButton, Text, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import type { Company } from "@/services/types";
import { STATUS_COLORS, spacing } from "@/theme";

const isWeb = process.env.EXPO_OS === "web";

interface Props {
  company: Company;
}

export const CompanyCard = memo(function CompanyCard({ company }: Props) {
  const theme = useTheme();
  const router = useRouter();

  const statusColor = STATUS_COLORS[company.status] ?? theme.colors.outline;

  const nextInterview = company.next_interview
    ? new Date(company.next_interview).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Animated.View entering={FadeIn.duration(200)}>
    <Card
      style={isWeb ? styles.cardWeb : styles.card}
      mode="elevated"
      onPress={() => router.push(`/company/${company.id}`)}
    >
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text variant="titleMedium" style={styles.name} numberOfLines={1}>
              {company.name}
            </Text>
            <IconButton
              icon="pencil"
              size={18}
              style={styles.editButton}
              onPress={(e) => {
                e.stopPropagation?.();
                router.push(`/company/${company.id}/edit`);
              }}
            />
          </View>
          {company.role ? (
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
              numberOfLines={1}
            >
              {company.role}
            </Text>
          ) : null}
        </View>

        <View style={styles.meta}>
          <View style={styles.metaRow}>
            <Chip
              compact
              textStyle={styles.chipText}
              style={[styles.statusChip, { backgroundColor: statusColor + "18" }]}
            >
              <Text style={[styles.chipLabel, { color: statusColor }]}>
                {company.status}
              </Text>
            </Chip>
            <Chip compact icon="stairs" textStyle={styles.chipText} style={styles.metaChip}>
              {company.stage}
            </Chip>
            {company.salary ? (
              <Chip
                compact
                icon="currency-usd"
                textStyle={styles.chipText}
                style={styles.metaChip}
              >
                {company.salary}
              </Chip>
            ) : null}
          </View>
          {nextInterview ? (
            <View style={styles.dateRow}>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Next: {nextInterview}
              </Text>
            </View>
          ) : null}
        </View>
      </Card.Content>
    </Card>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
    borderCurve: "continuous",
  },
  cardWeb: {
    marginBottom: spacing.sm,
    borderRadius: 12,
    borderCurve: "continuous",
  },
  content: {
    gap: spacing.xs,
  },
  header: {
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  name: {
    fontWeight: "600",
    flex: 1,
  },
  editButton: {
    margin: -spacing.sm,
  },
  statusChip: {},
  chipText: {
    fontSize: 12,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  meta: {
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  metaChip: {},
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
