# Daymark — habit tracker

A simple, private habit tracker for iPhone, built with Expo (React Native).
It is built to fix the most common complaints in App Store reviews of other habit trackers:

| Complaint in competitor reviews | What Daymark does |
|---|---|
| "Only 3 habits free, then pay" | Unlimited habits, free |
| Streaks and history lost after a restore or update | Data lives in an on-device SQLite database with versioned migrations, is included in iCloud/device backups, and can be exported to a file |
| Can't fix a missed check-in | Tap any past day (week strip or history grid) to fix it |
| Rest days break the streak | Per-habit schedules; unscheduled days never break a streak |
| Accounts, tracking | No account, no analytics, nothing leaves the phone |

## Project layout

```
src/app/             screens (Expo Router)
  (tabs)/index.tsx   Today
  (tabs)/settings.tsx  backup / restore / about
  habit/new.tsx      create form (modal)
  habit/[id].tsx     stats + history heatmap
  habit/edit/[id].tsx edit / delete (modal)
src/components/      HabitCard, Heatmap, HabitForm
src/lib/             dates (streak logic), db (SQLite), store (state), reminders, backup
```

## Develop

```bash
npm install
npm test            # streak + backup unit tests
npm run typecheck
npm run lint
npx expo start      # open in Expo Go on your iPhone by scanning the QR code
```

## Publish to the App Store (no Mac needed)

You build and submit in Expo's cloud with EAS. You need:

1. **Apple Developer Program** membership ($99/year) — https://developer.apple.com/programs/enroll/
   (Approval can take 1–2 days.)
2. A free **Expo account** — https://expo.dev/signup

Then, from this `habit-app` folder on any computer with Node.js:

```bash
npm install
npx eas-cli@latest login
npx eas-cli@latest init                       # links the project to your Expo account
npx eas-cli@latest build -p ios --profile production
```

The build asks for your Apple ID and creates the certificates and provisioning profile for you.
If the bundle identifier `app.daymark.habits` is already taken, change `ios.bundleIdentifier` in `app.json` to something unique such as `com.yourname.daymark`.

When the build finishes:

```bash
npx eas-cli@latest submit -p ios --latest
```

This creates the app in App Store Connect (if needed) and uploads the build. Then in
[App Store Connect](https://appstoreconnect.apple.com):

1. **TestFlight** — install the build on your iPhone and try it.
2. **App Information** — paste the copy from `store/LISTING.md`; set category *Health & Fitness* (secondary *Productivity*).
3. **App Privacy** — choose **"Data Not Collected"**. Add the privacy policy URL (see `PRIVACY.md`).
4. **Screenshots** — take them on your iPhone from the TestFlight build (6.9" / 6.7" sizes are required).
5. **Submit for Review.** Reviews usually take 1–3 days.

To ship a new version later: bump `version` in `app.json`, then build and submit again
(the build number increments automatically).
