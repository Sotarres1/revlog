# RevLog — Project Handoff

**Last updated:** 8 August 2026 (evening — after new-Mac migration)
**Owner:** Spencer Serratos
**Project lives at:** `~/Developer/revlog`

---

## 👋 If you are Claude (or any AI assistant) reading this

Spencer will likely open a session saying something like *"you helped me build this
app before, can you help again?"* — you have **no memory** of prior sessions. This
file is your context. Read it fully, then read `SETUP-NEW-MAC.md` before suggesting
anything.

**The four things that will waste your time if you don't know them:**

1. **Expo Go does not work with this project.** Don't suggest it. Don't debug it.
   See "Hard-won lessons" below.
2. **The Supabase project pauses after 7 days idle** and the symptom looks like a
   code bug ("hostname cannot be found"). It isn't. Check the dashboard first.
3. **Spencer is not a developer by trade.** Give exact commands to paste, explain
   what errors mean rather than just fixing them, and don't assume tools are
   installed — verify.
4. **Replying in Resolution Center does NOT put the app back in the review
   queue.** Learned the hard way 8 Aug 2026. See "Hard-won lessons."

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

**Dev environment: migrated to a new MacBook 8 Aug 2026.** Node 24.19.0 / npm
11.17.0, `expo-doctor` 20/20. Node 24 works fine despite older notes saying
Node 22 — no downgrade needed. The old Mac was sold; nothing was lost, because
everything except `.env` was already committed and pushed.

**App Store: REJECTED — action required, not waiting.**

- First submission (v1.0 build 2, SDK 54) was **rejected 6 Aug 2026** under
  Guideline 2.1 — reviewer couldn't sign in with the demo account.
- **Cause:** the Supabase project had auto-paused from inactivity. The credentials
  were always valid. Not a code problem.
- Restored the database, verified the demo login, replied in Resolution Center
  8 Aug 2026. No new build was needed.
- App name was changed from Apple's placeholder `RevLog (57d50c)` to
  **"RevLog: Car Maintenance Log"**.
- **8 Aug 2026 (evening):** App Store Connect still shows *Rejected*, with the
  banner *"Your app version was rejected and no other items submitted can be
  accepted or approved."* That is the **Unresolved Issues** state — the reply
  posted, but the submission is NOT back in the queue. It must be resubmitted
  manually. See "Resubmitting after rejection" below.
- Supabase verified awake and demo login re-tested successfully 8 Aug 2026.

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

Full instructions in **`SETUP-NEW-MAC.md`**. This exact sequence was run on a
bare MacBook on 8 Aug 2026 and took well under an hour:

```bash
# 1. Command line tools (gives you git + compilers). Popup → Install.
xcode-select --install

# 2. Node — use the .pkg installer from nodejs.org, NOT Homebrew.
#    Homebrew needs a manual PATH step afterward and is the usual place
#    people get stuck. Skip it; nothing here needs it.
#    Quit and reopen Terminal after installing, then:
node -v && npm -v

# 3. Clone and restore credentials
mkdir -p ~/Developer && cd ~/Developer
git clone https://github.com/Sotarres1/revlog.git
cd revlog
cp /path/to/backup/.env ./.env      # or rebuild from eas.json / Supabase dashboard
npm install
npx expo-doctor                      # expect 20/20

# 4. Run it
npx expo start
```

**You probably do NOT need a new development build.** The dev client lives on the
*iPhone*, not the Mac — replacing the Mac doesn't remove it. Just run
`npx expo start`, scan the QR with the Camera app, and it connects. Only rebuild
(`npx eas-cli build --profile development --platform ios`) if the app is gone from
the phone or you've switched phones. This saved ~15 minutes on the 8 Aug migration.

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

**Replying in Resolution Center does not resubmit the app.** This cost real days.
A reply keeps the conversation open, but the version stays in **Unresolved
Issues** and no reviewer picks it up. The tell is the banner *"Your app version
was rejected and no other items submitted can be accepted or approved. You can
make edits to your app version below."* If you see that, the ball is in your
court. See "Resubmitting after rejection" below.

**Node 24 works.** Older notes in this repo specify Node 22. As of 8 Aug 2026,
Node 24.19.0 passes `expo-doctor` 20/20 on SDK 57. Don't downgrade preemptively —
let `expo-doctor` decide.

**Skip Homebrew on a fresh Mac.** The nodejs.org `.pkg` installer sets PATH
correctly on its own. Homebrew's post-install PATH step is an easy thing to miss
and produces a confusing `command not found: node` afterward.

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

## Resubmitting after rejection

Replying in Resolution Center is not enough. To actually get back in the queue:

1. App Store Connect → **Apps** → RevLog
2. **View App Review Issues & Messages**
3. In the **In Progress** section, click **Resolve** next to the submission
4. Click **Edit** next to the rejected item, make any changes, then **Add for
   Review**
5. From the submission details page, click **Resubmit to App Review**

**You get only one edit pass before resubmitting**, so make every metadata change
you want — app name, description, screenshots — before clicking through.

**If those buttons aren't visible:** left sidebar → **App Review** (under General)
→ **In Progress** → **View** → **Cancel Submission** at the bottom. Counter-
intuitive, but cancelling releases the stuck submission and re-enables
**Add for Review**. Do NOT delete the build — the binary was never the problem
and deleting it forces an unnecessary rebuild.

### Know these two statuses apart

| Status | Meaning |
|---|---|
| **Ready for Review** | **NOT submitted.** Staged only. You still must click *Submit to App Review*. |
| **Waiting for Review** | Actually in Apple's queue. This is the one you want. |

Twice now this project has stalled because something *looked* like progress while
the ball was still in Spencer's court. Don't stop until it says **Waiting for
Review**.

No new build is required for a demo-account or metadata rejection. The same
binary can be resubmitted.

---

## Open items

1. **Resubmit to App Review.** As of 8 Aug 2026 evening this is the blocking item
   and it is on Spencer, not Apple. Verify the demo login first, then follow
   "Resubmitting after rejection" above.
2. **Upgrade Supabase to Pro ($25/mo).** Free-tier pausing already cost one App
   Store rejection and will break the app for real users after launch. Treat as a
   launch requirement. Until then, keep the database warm — see below.
3. **Keep the database awake until Pro.** The reliable options, best first:
   - Upgrade to Pro (removes the problem entirely)
   - A free external cron service (e.g. cron-job.org) hitting the REST endpoint
     daily — runs in the cloud, works whether or not the Mac is on
   - A local `cron` entry on the Mac (only fires when the Mac is awake)
   - Opening RevLog on the iPhone every few days (manual, easy to forget — this
     is what failed in August)
4. **After approval:** the live build is SDK 54. Ship a fresh SDK 57 production
   build when convenient:
   `npx eas-cli build --platform ios --profile production` then
   `npx eas-cli submit --platform ios`.
5. **`README.md` "What to build next"** lists further feature ideas. Note that
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
