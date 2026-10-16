import * as Notifications from 'expo-notifications';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

import { strings } from './i18n';
import { useHabits } from './store';

/**
 * Daymark Pro, sold through RevenueCat.
 *
 * Setup (once): create products in App Store Connect, add them to a RevenueCat offering
 * with the $rc_annual, $rc_monthly and $rc_lifetime packages, attach them to an
 * entitlement named "pro", and put the RevenueCat iOS public SDK key in
 * EXPO_PUBLIC_REVENUECAT_IOS_KEY (see README).
 *
 * Without a key — development builds and the web preview — a stand-in store with the
 * planned prices is used so the paywall can be designed and tested.
 */
const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
const ENTITLEMENT = 'pro';
const USE_MOCK = !API_KEY && (__DEV__ || Platform.OS === 'web');
/** No real store to talk to: mock mode, or a build missing its key. */
const OFFLINE = USE_MOCK || !API_KEY || Platform.OS === 'web';

export type PlanId = 'annual' | 'monthly' | 'lifetime';

export type Plan = {
  id: PlanId;
  title: string;
  price: string;
  /** Price per month, e.g. "$2.50" (the paywall adds the localized "/mo"). */
  perMonth: string | null;
  /** Free-trial length in days, when the plan has one. */
  trialDays: number | null;
  /** Percent saved vs. paying monthly for a year. */
  savings: number | null;
  pkg: PurchasesPackage | null;
};

type ProState = {
  ready: boolean;
  /** False when the store can't be reached; the paywall says so instead of selling. */
  available: boolean;
  isPro: boolean;
  plans: Plan[];
  purchase: (plan: Plan) => Promise<'purchased' | 'cancelled'>;
  restore: () => Promise<boolean>;
};

const MOCK_PLANS: Plan[] = [
  { id: 'annual', title: 'Yearly', price: '$29.99', perMonth: '$2.50', trialDays: 7, savings: 50, pkg: null },
  { id: 'monthly', title: 'Monthly', price: '$4.99', perMonth: '$4.99', trialDays: null, savings: null, pkg: null },
  { id: 'lifetime', title: 'Lifetime', price: '$69.99', perMonth: null, trialDays: null, savings: null, pkg: null },
];

const ProContext = createContext<ProState | null>(null);

type PurchasesModule = typeof import('react-native-purchases').default;
let purchasesModule: Promise<PurchasesModule> | null = null;
function sdk(): Promise<PurchasesModule> {
  purchasesModule ??= import('react-native-purchases').then((m) => {
    m.default.configure({ apiKey: API_KEY });
    return m.default;
  });
  return purchasesModule;
}

const hasPro = (info: CustomerInfo) => info.entitlements.active[ENTITLEMENT] !== undefined;

function trialDaysOf(p: PurchasesPackage): number | null {
  const intro = p.product.introPrice;
  if (!intro || intro.price !== 0) return null;
  const n = intro.periodNumberOfUnits;
  switch (intro.periodUnit) {
    case 'DAY': return n;
    case 'WEEK': return n * 7;
    case 'MONTH': return n * 30;
    default: return null;
  }
}

function plansFrom(packages: PurchasesPackage[]): Plan[] {
  const find = (type: string) => packages.find((p) => p.packageType === type) ?? null;
  const annual = find('ANNUAL');
  const monthly = find('MONTHLY');
  const lifetime = find('LIFETIME');
  const plans: Plan[] = [];
  if (annual) {
    const savings = monthly ? Math.round((1 - annual.product.price / (monthly.product.price * 12)) * 100) : null;
    plans.push({
      id: 'annual', title: 'Yearly', price: annual.product.priceString,
      perMonth: annual.product.pricePerMonthString ?? null,
      trialDays: trialDaysOf(annual), savings: savings && savings > 0 ? savings : null, pkg: annual,
    });
  }
  if (monthly) {
    plans.push({
      id: 'monthly', title: 'Monthly', price: monthly.product.priceString, perMonth: monthly.product.priceString,
      trialDays: trialDaysOf(monthly), savings: null, pkg: monthly,
    });
  }
  if (lifetime) {
    plans.push({ id: 'lifetime', title: 'Lifetime', price: lifetime.product.priceString, perMonth: null, trialDays: null, savings: null, pkg: lifetime });
  }
  return plans;
}

/** An honest heads-up two days before a free trial converts — fewer surprise charges, fewer refunds and 1-star reviews. */
async function scheduleTrialReminder(trialDays: number) {
  if (trialDays < 3) return;
  const when = new Date();
  when.setDate(when.getDate() + trialDays - 2);
  when.setHours(10, 0, 0, 0);
  await Notifications.scheduleNotificationAsync({
    identifier: 'trial-ending',
    content: { title: strings().trialEndingTitle, body: strings().trialEndingBody },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
  }).catch(() => {});
}

export function ProProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(OFFLINE);
  const [available, setAvailable] = useState(USE_MOCK);
  const { settings, setSetting } = useHabits();
  const [realPro, setIsPro] = useState(false);
  // The stand-in store remembers its "purchase" in settings so it survives reloads.
  const isPro = USE_MOCK ? settings.mock_pro === '1' : realPro;
  const [plans, setPlans] = useState<Plan[]>(USE_MOCK ? MOCK_PLANS : []);

  useEffect(() => {
    if (OFFLINE) return;
    let alive = true;
    const onInfo = (info: CustomerInfo) => alive && setIsPro(hasPro(info));
    (async () => {
      try {
        const Purchases = await sdk();
        Purchases.addCustomerInfoUpdateListener(onInfo);
        const [info, offerings] = await Promise.all([Purchases.getCustomerInfo(), Purchases.getOfferings()]);
        if (!alive) return;
        setIsPro(hasPro(info));
        const found = plansFrom(offerings.current?.availablePackages ?? []);
        setPlans(found);
        setAvailable(found.length > 0);
      } catch {
        if (alive) setAvailable(false);
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
      sdk().then((P) => P.removeCustomerInfoUpdateListener(onInfo)).catch(() => {});
    };
  }, []);

  const purchase = useCallback(async (plan: Plan) => {
    if (USE_MOCK || !plan.pkg) {
      await setSetting('mock_pro', '1');
      return 'purchased' as const;
    }
    try {
      const Purchases = await sdk();
      const { customerInfo } = await Purchases.purchasePackage(plan.pkg);
      const pro = hasPro(customerInfo);
      setIsPro(pro);
      if (pro && plan.trialDays) await scheduleTrialReminder(plan.trialDays);
      return pro ? ('purchased' as const) : ('cancelled' as const);
    } catch (e) {
      if ((e as { userCancelled?: boolean | null }).userCancelled) return 'cancelled' as const;
      throw e;
    }
  }, [setSetting]);

  const restore = useCallback(async () => {
    if (USE_MOCK) return isPro;
    const Purchases = await sdk();
    const pro = hasPro(await Purchases.restorePurchases());
    setIsPro(pro);
    return pro;
  }, [isPro]);

  const value = useMemo(() => ({ ready, available, isPro, plans, purchase, restore }), [ready, available, isPro, plans, purchase, restore]);
  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}

export function usePro(): ProState {
  const s = useContext(ProContext);
  if (!s) throw new Error('usePro must be used inside ProProvider');
  return s;
}

/** Monthly Streak Shield allowance for Pro members. */
export const SHIELDS_PER_MONTH = 3;
