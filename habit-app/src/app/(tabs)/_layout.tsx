import { NativeTabs } from 'expo-router/native-tabs';

import { useStrings } from '../../lib/store';
import { usePalette } from '../../lib/theme';

export default function TabsLayout() {
  const p = usePalette();
  const s = useStrings();
  return (
    <NativeTabs tintColor={p.accent}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{s.tabToday}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'checkmark.circle', selected: 'checkmark.circle.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="progress">
        <NativeTabs.Trigger.Label>{s.tabProgress}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>{s.tabSettings}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
