import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { DATABASE_NAME, migrate } from '../lib/db';
import { ProProvider } from '../lib/purchases';
import { HabitsProvider } from '../lib/store';
import { usePalette } from '../lib/theme';
import { WidgetSync } from '../widgets/WidgetSync';

export default function RootLayout() {
  const scheme = useColorScheme();
  const p = usePalette();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: { ...base.colors, background: p.bg, card: p.bg, text: p.text, primary: p.accent, border: p.separator },
  };

  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrate}>
      <HabitsProvider>
        <ProProvider>
          <ThemeProvider value={theme}>
            <StatusBar style="auto" />
            <WidgetSync />
            <Stack screenOptions={{ headerShadowVisible: false, headerBackButtonDisplayMode: 'minimal' }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />
              <Stack.Screen name="paywall" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="habit/new" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="habit/edit/[id]" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="habit/library" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="habit/[id]" options={{ title: '', headerTransparent: false }} />
            </Stack>
          </ThemeProvider>
        </ProProvider>
      </HabitsProvider>
    </SQLiteProvider>
  );
}
