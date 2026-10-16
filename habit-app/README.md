# Daymark — habit tracker

A beautiful, private habit tracker for iPhone, built with Expo (React Native).
It fixes the most common complaints in competitors' App Store reviews, and makes money from Daymark Pro.

| Complaint in competitor reviews | What Daymark does |
|---|---|
| "Only 3 habits free, then pay" | Unlimited habits, free |
| Streaks lost after one bad day | **Streak Shields** (Pro) repair a missed day |
| Rest days break the streak | Per-habit schedules; days off never count as misses |
| Streaks/history lost after restore | On-device SQLite + iCloud device backup + backup file export |
| Surprise trial charges | Trial timeline on the paywall + reminder 2 days before billing |
| Accounts, tracking | No account, no analytics; nothing leaves the phone |

**Free:** unlimited habits, the Habit Library (50 habits, 7 packs), small Home Screen and Lock Screen widgets, streaks, reminders, Streak Guard, milestone celebrations, 5 weeks of history, backups.
**Pro:** interactive medium/large widgets (check off from the Home Screen), Streak Shields (3/month), Insights, full history. Yearly with a 7-day trial, monthly, or lifetime.

## Project layout

```
src/app/                  screens (Expo Router)
  onboarding/             welcome → pick habits → Streak Guard → paywall
  (tabs)/                 Today · Progress · Settings (native iOS tab bar)
  paywall.tsx             Daymark Pro
  habit/[id].tsx          stats + history grid
  habit/new.tsx, habit/edit/[id].tsx
  habit/library.tsx       Habit Library and packs
src/widgets/              Home/Lock Screen widget (TodayWidget), its data (props), app↔widget sync
src/components/           ui kit (icons, rings, logo, lists), HabitRow, Heatmap, HabitForm, Celebration
src/lib/
  dates.ts                streaks, Streak Shields, rescue logic (unit-tested)
  db.ts                   SQLite schema + queries
  store.tsx               app state, milestones, review prompt
  purchases.tsx           RevenueCat (stand-in store in development)
  nudges.ts               Streak Guard notifications
  library.ts              curated habits and packs
  reminders.ts, backup.ts, icons.ts, theme.ts, config.ts
store/                    App Store listing, screenshots, launch plan
```

## Develop

```bash
npm install
npm test            # streak, shield and backup unit tests
npm run typecheck
npm run lint
```

The app uses native modules (in-app purchases, SF Symbols, native tabs), so run it in a **development build**, not Expo Go:
`npx eas-cli@latest build -p ios --profile preview`, then install it on your iPhone from the link.
Without a RevenueCat key, development builds use a stand-in store so you can try the paywall without paying.

## Widgets

Built with `expo-widgets`: the layout in `src/widgets/TodayWidget.tsx` is SwiftUI (via `@expo/ui`) and runs inside the widget.
Families: small, medium, large, and Lock Screen circular, rectangular and inline. Medium and large rows are buttons for Pro
members: a tap updates the widget immediately and is applied to the app's data the next time it opens.

EAS Build creates the widget extension (`app.daymark.habits.widgets`) and the App Group
`group.app.daymark.habits` for you. Widgets need a development or TestFlight build; they don't run in Expo Go.
The layout function may only use its arguments and the imported SwiftUI components (see the comment in the file).

## Set up subscriptions (once)

1. **App Store Connect › Business:** accept the Paid Apps Agreement and add your bank and tax details. Purchases won't work until this is done.
2. **App Store Connect › your app › Subscriptions:** create a group "Daymark Pro" with `daymark_pro_yearly` ($29.99, introductory offer: 1 week free) and `daymark_pro_monthly` ($4.99). Under **In-App Purchases**, add the non-consumable `daymark_pro_lifetime` ($69.99). (Details in `store/LISTING.md`.)
3. **RevenueCat** (free until $2.5k/month in revenue; https://app.revenuecat.com):
   - Create a project and add an App Store app with bundle ID `app.daymark.habits`, then upload an In-App Purchase key (.p8) from App Store Connect.
   - Import the three products. Create an entitlement named **`pro`** and attach all three.
   - Create an offering **`default`** (mark it current) with the packages **Annual**, **Monthly** and **Lifetime**.
4. Copy the **public Apple SDK key** (starts with `appl_`) into EAS:
   ```bash
   npx eas-cli@latest env:create --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value appl_XXXX --environment production --environment preview --visibility plaintext
   ```
   **Without this key, production builds show "Purchases aren't available" and nobody can buy Pro.**
5. Test with a Sandbox Apple ID (Settings › App Store › Sandbox Account) on a TestFlight build.

## Publish to the App Store (no Mac needed)

You need an Apple Developer Program membership ($99/year) and a free Expo account.

```bash
npm install
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build -p ios --profile production
npx eas-cli@latest submit -p ios --latest
```

If `app.daymark.habits` is already taken, change `ios.bundleIdentifier` in `app.json` (and in RevenueCat).
After the app exists in App Store Connect, put its numeric Apple ID in `APP_STORE_ID` in `src/lib/config.ts` so sharing and rating link to it.

Then in App Store Connect: paste the listing from `store/LISTING.md`, upload `store/screenshots/` (6.9" display), answer App Privacy as listed there, attach the in-app purchases to the version, and submit. Read `store/LAUNCH.md` before launch day.
