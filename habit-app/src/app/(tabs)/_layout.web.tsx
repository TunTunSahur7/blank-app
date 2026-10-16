import { Tabs } from 'expo-router/tabs';
import type { SFSymbol } from 'expo-symbols';

import { Sym } from '../../components/ui';
import { usePalette } from '../../lib/theme';

// Web previews only. On iOS the native tab bar (_layout.tsx) is used.
const icon = (name: SFSymbol) =>
  function TabIcon({ color }: { color: unknown }) {
    return <Sym name={name} size={24} color={String(color)} />;
  };

export default function TabsLayout() {
  const p = usePalette();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: p.accent,
        tabBarInactiveTintColor: p.scheme === 'dark' ? '#8E8E93' : '#8A8A8E',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
        tabBarStyle: {
          position: 'absolute',
          height: 84,
          paddingTop: 6,
          backgroundColor: p.scheme === 'dark' ? 'rgba(22,22,24,0.86)' : 'rgba(249,249,249,0.9)',
          borderTopColor: p.separator,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: icon('checkmark.circle.fill') }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: icon('chart.bar.fill') }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: icon('gearshape.fill') }} />
    </Tabs>
  );
}
