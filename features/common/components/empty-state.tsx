import { StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Button, Text, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { spacing } from "@/theme";

interface Props {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: Props) {
  const theme = useTheme();

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      <MaterialCommunityIcons
        name={icon as "briefcase-outline"}
        size={64}
        color={theme.colors.outlineVariant}
      />
      <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
        {title}
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
      >
        {description}
      </Text>
      {actionLabel && onAction ? (
        <Button mode="contained" onPress={onAction} style={styles.button}>
          {actionLabel}
        </Button>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    marginTop: spacing.md,
    fontWeight: "600",
    textAlign: "center",
  },
  description: {
    textAlign: "center",
  },
  button: {
    marginTop: spacing.md,
    borderRadius: 12,
  },
});
