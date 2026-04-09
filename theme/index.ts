import { MD3LightTheme, configureFonts } from "react-native-paper";
import type { MD3Theme } from "react-native-paper";

const fontConfig = configureFonts({ config: { fontFamily: "System" } });

export const theme: MD3Theme = {
  ...MD3LightTheme,
  fonts: fontConfig,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#4F46E5", // Indigo 600
    onPrimary: "#FFFFFF",
    primaryContainer: "#E0E7FF", // Indigo 100
    onPrimaryContainer: "#312E81", // Indigo 900
    secondary: "#6366F1", // Indigo 500
    onSecondary: "#FFFFFF",
    secondaryContainer: "#EEF2FF", // Indigo 50
    onSecondaryContainer: "#3730A3", // Indigo 800
    tertiary: "#0EA5E9", // Sky 500
    onTertiary: "#FFFFFF",
    tertiaryContainer: "#E0F2FE", // Sky 100
    onTertiaryContainer: "#0C4A6E", // Sky 900
    error: "#DC2626", // Red 600
    onError: "#FFFFFF",
    errorContainer: "#FEE2E2", // Red 100
    onErrorContainer: "#991B1B", // Red 800
    background: "#F8FAFC", // Slate 50
    onBackground: "#0F172A", // Slate 900
    surface: "#FFFFFF",
    onSurface: "#0F172A", // Slate 900
    surfaceVariant: "#F1F5F9", // Slate 100
    onSurfaceVariant: "#475569", // Slate 600
    outline: "#CBD5E1", // Slate 300
    outlineVariant: "#E2E8F0", // Slate 200
    inverseSurface: "#1E293B", // Slate 800
    inverseOnSurface: "#F1F5F9", // Slate 100
    inversePrimary: "#A5B4FC", // Indigo 300
    elevation: {
      level0: "transparent",
      level1: "#FFFFFF",
      level2: "#F8FAFC",
      level3: "#F1F5F9",
      level4: "#E2E8F0",
      level5: "#CBD5E1",
    },
    surfaceDisabled: "rgba(15, 23, 42, 0.12)",
    onSurfaceDisabled: "rgba(15, 23, 42, 0.38)",
    backdrop: "rgba(15, 23, 42, 0.5)",
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const STATUS_COLORS: Record<string, string> = {
  Wishlist: "#6366F1",
  Active: "#16A34A",
  Paused: "#D97706",
  Offer: "#7C3AED",
  "Not replied": "#6B7280",
  Rejected: "#DC2626",
};

export const STAGE_STATUS_COLORS: Record<string, string> = {
  pending: "#CA8A04",
  completed: "#16A34A",
  cancelled: "#DC2626",
};

export const SNACKBAR_DURATION = 4000;

export const iconSizes = {
  sm: 16,
  md: 18,
  header: 22,
  empty: 64,
} as const;

export const WEB_MULTILINE_STYLE =
  process.env.EXPO_OS === "web"
    ? ({ fieldSizing: "content" } as any)
    : undefined;
