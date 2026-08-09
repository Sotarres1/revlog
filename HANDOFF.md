# RevLog — Project Handoff

**Last updated:** 8 August 2026
**Owner:** Spencer Serratos

---

## 👋 If you are Claude (or any AI assistant) reading this

Spencer will likely open a session saying something like *"you helped me build this
app before, can you help again?"* — you have **no memory** of prior sessions. This
file is your context. Read it fully, then read `SETUP-NEW-MAC.md` before suggesting
anything.

**The three things that will waste your time if you don't know them:**

1. **Expo Go does not work with this project.** Don't suggest it. Don't debug it.
   See "Hard-won lessons" below.
2. **The Supabase project pauses after 7 days idle** and the symptom looks like a
   code bug ("hostname cannot be found"). It isn't. Check the dashboard first.
3. **Spencer is not a developer by trade.** Give exact commands to paste, explain
   what errors mean rather than just fixing them, and don't assume tools are
   installed — verify.

---

## What RevLog is

A vehicle maintenance tracker for car enthusiasts. Log services, track mods and
fuel economy, get reminders before maintenance is due.

React Native + Expo (SDK 57) + Supabase. iOS-first. ~3,000 lines across 27 files.

**Bundle ID:** `com.spencer.revlog`
**Support email:** revlog.app@gmail.com

### Features built

- Email auth (sign up / log in / password reset)
- Garage: multiple vehicles, archive, photos, VIN decode auto-fills specs
- Service log: mileage, cost, shop, DIY flag, preset service types
- Reminders: by date and/or mileage, recurring intervals, push notifications
- Fuel log: fill-ups with MPG calculated between full tanks
- Mods tracker: build sheet with brand, cost, install date
- Per-vehicle stats screen

### Structure

```
app/                  Screens (expo-router: file = route)
  (auth)/             login, signup, reset
  (tabs)/             index (garage), reminders, settings
  vehicle/            add, [id] detail
  log/add.tsx         log a service
  fuel/               add, [vehicleId] list
  mods/               add, [vehicleId] list
  reminder/add.tsx
  stats/[vehicleId].tsx
  archived.tsx
components/           VehicleCard, MakeLogo, FormScroll
constants/theme.ts    Colors and spacing — edit to restyle everything
lib/                  supabase client, types, vin decoder, date helpers, notifications
supabase/migrations/  001_initial_schema.sql (already applied)
```

---

## Current status

**The app works.** Runs on device via development build, all features functional,
`expo-doctor` 20/20, typecheck clean.

**App Store: awaiting re-review.**

- First submission (v1.0 build 2, SDK 54) was **rejected 6 Aug 2026** under
  Guideline 2.1 — reviewer couldn't sign in with the demo account.
- **Cause:** the Supabase project had auto-paused from inactivity. The credentials
  were always valid. Not a code problem.
- Restored the database, verified the demo login, replied in Resolution Center
  8 Aug 2026. No new build was needed.
- App name was changed from Apple's placeholder `RevLog (57d50c)` to
  **"RevLog: Car Maintenance Log"**.

**⚠️ Open risk:** Supabase is still on the **free tier**, which pauses after 7 days
without a database query. If it pauses again during review, it will be rejected for
the identical reason. See "Open items."

---

## Accounts

Passwords are **not** stored here — keep them in a password manager. This is the
list of what you need access to.

| Service | Identifier | Notes |
|---|---|---|
| **Expo / EAS** | `@2tuff113` | Owns builds + OTA updates. Project ID `ce509968-1f73-4c8b-9bb8-da2685455002` |
| **Supabase** | project `qcxkmzmyvfxlwvgmjkxk` | Free tier — see open items |
| **GitHub** | `Sotarres1` | Repo: https://github.com/Sotarres1/revlog |
| **Apple Developer** | Team ID `2NA2LW2AL9` | "SPENCER FJ SERRATOS (Individual)". Distribution cert valid to 27 Jul 2027 |
| **Support inbox** | revlog.app@gmail.com | Listed publicly in the App Store listing |

**App Review demo account** (Apple needs this to work at all times):

```
sserratos589+demo@gmail.com
RevLogDemo2026
```

It is seeded with vehicles, service history, fuel logs, mods, and reminders so a
reviewer can evaluate every feature. **Don't delete this account or its data.**

---

## ⚠️ Files NOT in git — these must be transferred manually

Everything else is on GitHub. These are not:

- **`.env`** — Supabase URL and anon key. Gitignored.
  *Recovery if lost:* the same two values are in `eas.json` under
  `build.production.env`, which **is** committed. Or copy from Supabase dashboard →
  Settings → API.
- **`node_modules/`** — don't transfer, reinstall with `npm install`.
- **`dist/`, `.expo/`** — build artifacts, regenerate automatically.

So the minimum you need to carry across is `.env`, and even that is recoverable.

---

## Setting up on a new Mac

Full instructions in **`SETUP-NEW-MAC.md`**. Short version:

```bash
# 1. Install Node LTS from nodejs.org, then:
git clone https://github.com/Sotarres1/revlog.git
cd revlog
npm install

# 2. Recreate .env (see above), then:
npx expo login          # account @2tuff113
npx eas-cli build --profile development --platform ios
# scan QR to install on phone, enable Developer Mode when prompted

# 3. Then daily development is just:
npx expo start
```

---

## Hard-won lessons — read before debugging

**Expo Go is a dead end for this project.** Expo Go ships one SDK version at a
time and Apple's review keeps the App Store build months behind. This project is on
SDK 57; the store build was older, producing *"Project is incompatible with this
version of Expo Go."* Use the development build. Expo themselves say Expo Go is an
educational tool, not a dev environment for apps you ship.

**"Sign in failed / hostname cannot be found" = paused database, not a bug.** Free
Supabase projects pause after 7 idle days. Restore from the dashboard; data is
intact. This caused the App Store rejection.

**Never run `npm audit fix --force`.** The ~20 reported vulnerabilities are in build
tooling that never ships in the app. `--force` breaks Expo's pinned versions.
`npx expo-doctor@latest` is the check that matters.

**Use `npx expo start --clear` after any SDK change.** Stale Metro cache produces
errors that look like code problems and aren't.

**Phone can't connect to Metro?** On the phone, open `http://<mac-ip>:8081` in
Safari. JSON returned = network is fine, look elsewhere. Timeout = firewall or
wrong Wi-Fi. Also check the terminal isn't sitting on an unanswered prompt — that
blocks the dev server and the phone just times out.

**Registering a device with EAS:** choose **Website**, and open the URL in
**Safari**. Other iOS browsers cannot install configuration profiles.

**Don't install npm packages globally** — it fails with permission errors (exit
code 243) on a default Node install. Use `npx <tool>`.

**Working from an external drive** creates `._*` AppleDouble files that Metro may
try to bundle. `git config core.fileMode false` also stops a phantom
"every file modified" diff.

---

## Open items

1. **Upgrade Supabase to Pro ($25/mo).** Free-tier pausing already cost one App
   Store rejection and will break the app for real users after launch. Treat as a
   launch requirement. Until then, open the app every few days to keep it warm.
2. **Wait on App Review.** Reply was sent 8 Aug 2026. Check App Store Connect →
   My Apps → RevLog. Status should move from Rejected to In Review.
3. **After approval:** the live build is SDK 54. Ship a fresh SDK 57 production
   build when convenient:
   `npx eas-cli build --platform ios --profile production` then
   `npx eas-cli submit --platform ios`.
4. **`README.md` "What to build next"** lists further feature ideas. Note that
   list is stale — most of it is already built.

---

## Deploying changes

**JS/TS only changes** (screens, styling, logic) — no rebuild needed:

```bash
npx eas-cli update --branch production --message "what changed"
```

Users get it on next app launch.

**Native changes** (adding/removing an `expo-*` package, SDK upgrade) — full build:

```bash
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios
```

---

## Before selling this Mac

See **`TRANSFER-CHECKLIST.md`**.
