import { useAuthStore } from "@/features/auth/store";
import { spacing, theme as appTheme } from "@/theme";
import { Link } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, StyleSheet, View } from "react-native";
import {
  Button,
  HelperText,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

type AuthFormProps = {
  mode: "login" | "register";
};

const CONFIG = {
  login: {
    title: "Welcome back",
    subtitle: "Sign in to track your interviews",
    buttonLabel: "Sign In",
    footerText: "Don't have an account? ",
    footerLinkLabel: "Sign Up",
    footerLinkHref: "/(auth)/register" as const,
  },
  register: {
    title: "Create account",
    subtitle: "Start tracking your interview process",
    buttonLabel: "Create Account",
    footerText: "Already have an account? ",
    footerLinkLabel: "Sign In",
    footerLinkHref: "/(auth)/login" as const,
  },
};

export function AuthForm({ mode }: AuthFormProps) {
  const theme = useTheme();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const config = CONFIG[mode];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isValid =
    mode === "register"
      ? name.trim() && email.trim() && password.trim()
      : email.trim() && password.trim();

  const handleSubmit = async () => {
    if (!isValid) return;
    try {
      if (mode === "register") {
        await register(email.trim(), password, name.trim());
      } else {
        await login(email.trim(), password);
      }
    } catch {
      // error is set in store
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text variant="headlineLarge" style={{ fontWeight: "700" }}>
            {config.title}
          </Text>
          <Text
            variant="bodyLarge"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: spacing.xs }}
          >
            {config.subtitle}
          </Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <HelperText type="error" visible>
              {error}
            </HelperText>
          ) : null}

          {mode === "register" ? (
            <TextInput
              label="Name"
              value={name}
              onChangeText={(t) => {
                clearError();
                setName(t);
              }}
              mode="outlined"
              autoCapitalize="words"
              autoComplete="name"
              style={styles.input}
            />
          ) : null}

          <TextInput
            label="Email"
            value={email}
            onChangeText={(t) => {
              clearError();
              setEmail(t);
            }}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={styles.input}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={(t) => {
              clearError();
              setPassword(t);
            }}
            mode="outlined"
            secureTextEntry={!showPassword}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading || !isValid}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {config.buttonLabel}
          </Button>

          <View style={styles.footer}>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {config.footerText}
            </Text>
            <Link href={config.footerLinkHref} asChild>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.primary, fontWeight: "600" }}
              >
                {config.footerLinkLabel}
              </Text>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.sm,
  },
  input: {
    backgroundColor: "transparent",
  },
  button: {
    marginTop: spacing.md,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
});
