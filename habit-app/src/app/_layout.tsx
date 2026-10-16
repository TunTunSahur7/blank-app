import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { DATABASE_NAME, migrate } from '../lib/db';
import { HabitsProvider } from '../lib/store';
import { usePalette } from '../lib/theme';

export default function RootLayout() {
  const scheme = useColorScheme();
  const p = usePalette();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: { ...base.colors, background: p.bg, card: p.bg, text: p.text, primary: p.accent, border: p.faint },
  };

  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrate}>
      <HabitsProvider>
        <ThemeProvider value={theme}>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShadowVisible: false, headerBackButtonDisplayMode: 'minimal' }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="habit/new" options={{ presentation: 'modal', title: 'New habit' }} />
            <Stack.Screen name="habit/[id]" options={{ title: '' }} />
            <Stack.Screen name="habit/edit/[id]" options={{ presentation: 'modal', title: 'Edit habit' }} />
          </Stack>
        </ThemeProvider>
      </HabitsProvider>
    </SQLiteProvider>
  );
}
