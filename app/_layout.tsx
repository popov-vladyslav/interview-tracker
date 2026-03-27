import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { CompaniesProvider } from '@/lib/companies-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <CompaniesProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="company/add"
            options={{
              presentation: 'formSheet',
              title: 'Add Company',
              sheetGrabberVisible: true,
              sheetAllowedDetents: [0.85, 1.0],
            }}
          />
          <Stack.Screen
            name="company/[id]"
            options={{
              presentation: 'formSheet',
              title: 'Edit Company',
              sheetGrabberVisible: true,
              sheetAllowedDetents: [0.85, 1.0],
            }}
          />
        </Stack>
      </CompaniesProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
