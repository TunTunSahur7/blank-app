import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import type { SFSymbol } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoMark, PrimaryButton, Sym } from '../components/ui';
import { PRIVACY_URL, TERMS_URL } from '../lib/config';
import { rescuable } from '../lib/dates';
import { SHIELDS_PER_MONTH, usePro, type Plan } from '../lib/purchases';
import type { Strings } from '../lib/i18n';
import { useHabits, useStrings } from '../lib/store';
import { FONT, usePalette } from '../lib/theme';

type From = 'onboarding' | 'shield' | 'history' | 'insights' | 'settings' | 'widget';

const benefits = (s: Strings): { icon: SFSymbol; color: string; title: string; body: string }[] => [
  { icon: 'shield.fill', color: '#007AFF', title: s.benefitShieldsTitle, body: s.benefitShieldsBody(SHIELDS_PER_MONTH) },
  { icon: 'apps.iphone', color: '#FF2D55', title: s.benefitWidgetsTitle, body: s.benefitWidgetsBody },
  { icon: 'chart.bar.fill', color: '#34C759', title: s.benefitInsightsTitle, body: s.benefitInsightsBody },
  { icon: 'calendar', color: '#FF9500', title: s.benefitHistoryTitle, body: s.benefitHistoryBody },
];

function headline(s: Strings, from: From, streak: number | null): { title: string; subtitle: string } {
  switch (from) {
    case 'shield':
      return { title: s.pwShieldTitle(streak), subtitle: s.pwShieldSub };
    case 'widget':
      return { title: s.pwWidgetTitle, subtitle: s.pwWidgetSub };
    case 'history':
      return { title: s.pwHistoryTitle, subtitle: s.pwHistorySub };
    case 'insights':
      return { title: s.pwInsightsTitle, subtitle: s.pwInsightsSub };
    case 'onboarding':
      return { title: s.pwOnboardingTitle, subtitle: s.pwOnboardingSub };
    default:
      return { title: s.proTitle, subtitle: s.pwDefaultSub };
  }
}

export default function PaywallScreen() {
  const p = usePalette();
  const s = useStrings();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ from?: string; habit?: string }>();
  const from = (params.from ?? 'settings') as From;
  const { plans, available, ready, purchase, restore } = usePro();
  const { habits, done, shields, today, applyShield } = useHabits();
  const [selected, setSelected] = useState<Plan['id']>('annual');
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);

  const habit = habits.find((h) => h.id === Number(params.habit));
  const rescue = useMemo(
    () => (habit ? rescuable(done.get(habit.id) ?? new Set(), habit.days, today, shields.get(habit.id)) : null),
    [habit, done, shields, today],
  );
  const { title, subtitle } = headline(s, from, rescue?.streak ?? null);
  const plan = plans.find((pl) => pl.id === selected) ?? plans[0];

  const close = () => {
    if (from === 'onboarding' || !router.canGoBack()) {
      if (router.canDismiss()) router.dismissAll();
      router.replace('/');
    } else {
      router.back();
    }
  };

  const afterUnlock = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (from === 'shield' && habit && rescue) {
      await applyShield(habit.id, rescue.day);
      Alert.alert(s.streakSavedTitle, s.streakSavedBody(rescue.streak, habit.name));
    }
    close();
  };

  const buy = async () => {
    if (!plan) return;
    setBusy('buy');
    try {
      if ((await purchase(plan)) === 'purchased') await afterUnlock();
    } catch {
      Alert.alert(s.purchaseFailedTitle, s.purchaseFailedBody);
    } finally {
      setBusy(null);
    }
  };

  const onRestore = async () => {
    setBusy('restore');
    try {
      if (await restore()) await afterUnlock();
      else Alert.alert(s.nothingToRestore, s.noPurchaseFound);
    } catch {
      Alert.alert(s.couldntRestoreTitle, s.couldntRestorePurchases);
    } finally {
      setBusy(null);
    }
  };

  const cta = !plan ? s.continue : plan.trialDays ? s.ctaTrial(plan.trialDays) : plan.id === 'lifetime' ? s.ctaLifetime : s.ctaSubscribe;
  const fine = !plan
    ? ''
    : plan.trialDays
      ? s.fineTrial(plan.trialDays, plan.price)
      : plan.id === 'lifetime'
        ? s.fineLifetime(plan.price)
        : s.fineMonthly(plan.price);
  const planTitle = (id: Plan['id']) => (id === 'annual' ? s.planYearly : id === 'monthly' ? s.planMonthly : s.planLifetime);

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: 24, paddingBottom: 24 }]}>
        <View style={styles.hero}>
          <LogoMark size={76} />
          <Text style={[styles.title, { color: p.text }]}>{title}</Text>
          <Text style={[FONT.callout, { color: p.muted, textAlign: 'center', lineHeight: 22 }]}>{subtitle}</Text>
        </View>

        <View style={{ gap: 16 }}>
          {benefits(s).map((b) => (
            <View key={b.title} style={styles.benefit}>
              <View style={[styles.benefitIcon, { backgroundColor: b.color }]}>
                <Sym name={b.icon} size={17} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={[FONT.headline, { color: p.text }]}>{b.title}</Text>
                <Text style={[FONT.subhead, { color: p.muted }]}>{b.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {!ready ? null : !available || plans.length === 0 ? (
          <Text style={[FONT.subhead, { color: p.muted, textAlign: 'center' }]}>
            {s.purchasesUnavailable}
          </Text>
        ) : (
          <View style={{ gap: 10 }}>
            {plans.map((pl) => {
              const on = pl.id === plan?.id;
              const badge = pl.trialDays ? s.daysFree(pl.trialDays) : pl.id === 'lifetime' ? s.payOnce : null;
              return (
                <Pressable
                  key={pl.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelected(pl.id);
                  }}
                  style={[styles.plan, { backgroundColor: p.card, borderColor: on ? p.accent : p.border }]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                >
                  <View style={[styles.radio, { borderColor: on ? p.accent : p.scheme === 'dark' ? '#48484A' : '#C7C7CC', backgroundColor: on ? p.accent : 'transparent' }]}>
                    {on && <Sym name="checkmark" size={12} color="#FFFFFF" weight="heavy" />}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={styles.planTitleRow}>
                      <Text style={[FONT.headline, { color: p.text }]}>{planTitle(pl.id)}</Text>
                      {badge && (
                        <View style={[styles.badge, { backgroundColor: pl.trialDays ? p.accent : p.fill }]}>
                          <Text style={[styles.badgeText, { color: pl.trialDays ? '#FFFFFF' : p.text }]}>{badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[FONT.footnote, { color: p.muted }]}>
                      {pl.id === 'annual' ? s.perYearSave(pl.price, pl.savings) : pl.id === 'monthly' ? s.billedMonthly : s.oneTime}
                    </Text>
                  </View>
                  <Text style={[FONT.headline, { color: p.text }]}>{pl.id === 'annual' && pl.perMonth ? pl.perMonth + s.perMonthSuffix : pl.price}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {plan?.trialDays ? (
          <View style={[styles.timeline, { backgroundColor: p.card }]}>
            {[
              { day: s.today, text: s.tlToday },
              { day: s.tlDay(plan.trialDays - 2), text: s.tlRemind },
              { day: s.tlDay(plan.trialDays), text: s.tlBilled(plan.price) },
            ].map((step, i, all) => (
              <View key={step.day} style={styles.step}>
                <View style={{ alignItems: 'center', width: 14 }}>
                  <View style={[styles.stepDot, { backgroundColor: i === 0 ? p.accent : p.faint }]} />
                  {i < all.length - 1 && <View style={[styles.stepLine, { backgroundColor: p.faint }]} />}
                </View>
                <View style={{ flex: 1, paddingBottom: i < all.length - 1 ? 14 : 0 }}>
                  <Text style={[FONT.subhead, { color: p.text, fontWeight: '600' }]}>{step.day}</Text>
                  <Text style={[FONT.footnote, { color: p.muted }]}>{step.text}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 8, borderTopColor: p.separator, backgroundColor: p.bg }]}>
        <PrimaryButton title={cta} onPress={buy} loading={busy === 'buy'} disabled={!available || !plan || busy !== null} />
        {!!fine && <Text style={[FONT.caption, { color: p.muted, textAlign: 'center' }]}>{fine}</Text>}
        <View style={styles.links}>
          <Pressable onPress={onRestore} disabled={busy !== null} hitSlop={8} accessibilityRole="button">
            <Text style={[FONT.footnote, { color: p.muted }]}>{busy === 'restore' ? s.restoring : s.restore}</Text>
          </Pressable>
          <Text style={[FONT.footnote, { color: p.muted }]}>·</Text>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)} hitSlop={8} accessibilityRole="link">
            <Text style={[FONT.footnote, { color: p.muted }]}>{s.terms}</Text>
          </Pressable>
          <Text style={[FONT.footnote, { color: p.muted }]}>·</Text>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={8} accessibilityRole="link">
            <Text style={[FONT.footnote, { color: p.muted }]}>{s.privacy}</Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        onPress={close}
        hitSlop={8}
        style={[styles.close, { backgroundColor: p.fill, top: 14 }]}
        accessibilityRole="button"
        accessibilityLabel={from === 'onboarding' ? s.notNow : s.close}
      >
        <Sym name="xmark" size={13} color={p.muted} weight="bold" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, gap: 28 },
  hero: { alignItems: 'center', gap: 10, paddingTop: 8 },
  title: { fontSize: 30, fontWeight: '700', letterSpacing: 0.3, textAlign: 'center', marginTop: 6 },
  benefit: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  benefitIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, borderWidth: 2 },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  timeline: { borderRadius: 16, padding: 16 },
  step: { flexDirection: 'row', gap: 12 },
  stepDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  stepLine: { width: 2, flex: 1, marginTop: 2 },
  footer: { paddingHorizontal: 24, paddingTop: 12, gap: 10, borderTopWidth: StyleSheet.hairlineWidth },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  close: { position: 'absolute', right: 16, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
