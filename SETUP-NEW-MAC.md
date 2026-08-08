# RevLog — setting up on a new Mac

Everything you need to get back to work. Run these in Terminal, in order.

Project lives at: `/Volumes/X10SSD/MACBOOK AIR M4/revlog`

```bash
cd "/Volumes/X10SSD/MACBOOK AIR M4/revlog"
```

> **Tip:** working off the external SSD is fine, but it's slower and macOS
> litters it with `._*` junk files. If you have room, copy the folder to
> `~/Developer/revlog` and work there instead. Everything below works either way.

---

## 1. Install the tools

```bash
# Xcode command line tools (needed by git + node builds)
xcode-select --install

# Homebrew, if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node 22 LTS
brew install node@22
```

Check it worked:

```bash
node -v    # should print v22.x
npm -v
```

Optional but recommended:

- **Xcode** from the Mac App Store (only needed if you want the iOS Simulator)
- **Expo Go** on your iPhone — fastest way to test
- **VS Code** from https://code.visualstudio.com

---

## 2. Reinstall dependencies

The `node_modules` folder came from your old Mac. Wipe it and reinstall clean:

```bash
rm -rf node_modules
npm install
```

Then verify nothing drifted out of sync with the Expo SDK:

```bash
npx expo-doctor
```

If it reports package version mismatches, fix them with:

```bash
npx expo install --check
```

---

## 3. Confirm your credentials

Two files hold the Supabase connection. Both are already filled in — just confirm:

- `.env` — used when you run locally (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
- `eas.json` — same two values under `build.production.env`, used for cloud builds

Supabase project: `qcxkmzmyvfxlwvgmjkxk`. Log in at https://supabase.com/dashboard
to confirm you still have access. The schema is already applied — you do **not**
need to re-run `supabase/migrations/001_initial_schema.sql`.

---

## 4. Run the app

```bash
npx expo start
```

Then open the app on your phone — **via the development build, not Expo Go**
(see the next section for why). If it hangs or behaves strangely:

```bash
npx expo start --clear
```

Use `--clear` any time you've changed SDK versions. Stale Metro cache after an
upgrade produces bizarre errors that look like code problems but aren't.

---

## 4b. Don't use Expo Go — read this first

**Expo Go from the App Store cannot run this project, and probably never will
again.** Expo Go only ships one SDK version at a time, Apple's review process
keeps it lagging months behind, and this project is on SDK 57. As of August 2026
the App Store build was still older than 57, which produces:

> Project is incompatible with this version of Expo Go.
> The project you requested requires a newer version of Expo Go.

That is not a bug in your setup. Don't chase it. Expo themselves say Expo Go is
an educational tool and shouldn't be the dev environment for an app you're
shipping to the App Store.

**Use the development build instead.** It's your own app binary with dev tooling
compiled in, so it's immune to Expo Go's versioning entirely.

```bash
npx eas-cli build --profile development --platform ios
```

Builds in Expo's cloud (~15 min, no Xcode needed). When it finishes, scan the QR
code to install RevLog on your phone. After that, `npx expo start` connects to it
directly and development works normally.

You only need to rebuild the dev client when native code changes — adding or
removing an `expo-*` package, or upgrading the SDK. Plain JS/TS edits hot-reload
as always.

**Registering a new device** (new phone, or first build on a new machine): EAS
asks how to register — pick **Website**, open the URL on the iPhone **in Safari**
(other browsers can't install iOS configuration profiles), tap the register
button, allow the download, then Settings → General → VPN & Device Management →
install the profile.

---

## 5. Reconnect to Expo / EAS

Your Expo account holds the build history and the OTA update channel.

```bash
npx eas-cli login
npx eas-cli whoami          # confirm you're on the right account
npx eas-cli build:list      # see your previous builds
```

EAS project ID is `ce509968-1f73-4c8b-9bb8-da2685455002` (already in `app.json`).

To make a new build:

```bash
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios
```

To push a JS-only change without a full rebuild:

```bash
npx eas-cli update --branch production --message "what changed"
```

---

## 6. Git

Remote: https://github.com/Sotarres1/revlog

```bash
git status
git log --oneline -5
```

If GitHub asks for a password, it wants a Personal Access Token, not your
account password. Easiest fix is the GitHub CLI:

```bash
brew install gh
gh auth login
```

---

## Where the App Store submission left off

`STORE_LISTING.md` has all the copy ready to paste. The key open item noted there:
the app was uploaded once and Apple assigned the placeholder name
`RevLog (57d50c)` because plain "RevLog" was taken. It needs to be renamed to
**"RevLog: Car Maintenance Log"** in App Store Connect →
My Apps → App Information → Name.

Screenshots are in `screenshots/`.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Metro bundler errors after pulling changes | `npx expo start --clear` |
| "Project is incompatible with this version of Expo Go" | Expected — use the development build, see section 4b |
| Phone can't connect to Metro | On the phone, open `http://<your-mac-ip>:8081` in Safari. JSON = network is fine, look elsewhere. Timeout = firewall or wrong Wi-Fi. |
| Metro log stays empty after scanning | Phone never reached the Mac — it's a network problem, not a code problem |
| Terminal seems frozen at a prompt | Expo asks you to log in before serving to Expo Go; an unanswered prompt blocks the dev server and the phone times out |
| Weird `._something.tsx` module errors | `find . -name '._*' -not -path './node_modules/*' -delete` |
| `command not found: expo` | Use `npx expo` — it's not installed globally |
| `npm install --global` fails with code 243 | Permissions. Use `npx <tool>` instead of installing globally |
| Login screen loops / auth fails | Check `.env` values match Supabase → Settings → API |
| Git shows every file as modified | Already fixed via `git config core.fileMode false` |

---

## Never run `npm audit fix --force`

`npm audit` reports 20-odd vulnerabilities. They're in build tooling — Metro,
Babel, CLI transitive dependencies — that never ships inside your app. `--force`
upgrades packages past the versions Expo pins and will break the project. Ignore
the warnings; `npx expo-doctor@latest` is the check that actually matters.
