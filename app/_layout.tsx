import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { theme } from "@/theme";
import { useAuthStore } from "@/features/auth/store";
import { ActivityIndicator, View } from "react-native";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style="dark" />
        <AuthGuard>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="company/[id]"
              options={{
                headerShown: true,
                animation: "slide_from_right",
                headerBackButtonDisplayMode: "minimal",
              }}
            />
            <Stack.Screen
              name="company/add"
              options={{
                headerShown: true,
                presentation: "modal",
                title: "Add Interview",
              }}
            />
            <Stack.Screen
              name="company/[id]/edit"
              options={{
                headerShown: true,
                presentation: "modal",
                title: "Edit Interview",
              }}
            />
          </Stack>
        </AuthGuard>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
