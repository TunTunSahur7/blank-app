import { Tabs } from 'expo-router/tabs';
import { SymbolView } from 'expo-symbols';
import { Text } from 'react-native';

import { usePalette } from '../../lib/theme';

export default function TabsLayout() {
  const p = usePalette();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: p.accent,
        tabBarInactiveTintColor: p.muted,
        tabBarStyle: { backgroundColor: p.bg, borderTopColor: p.faint },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => (
            <SymbolView name="checkmark.circle.fill" tintColor={color} size={size} fallback={<Text style={{ color }}>✓</Text>} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <SymbolView name="gearshape.fill" tintColor={color} size={size} fallback={<Text style={{ color }}>⚙︎</Text>} />
          ),
        }}
      />
    </Tabs>
  );
}
