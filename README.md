# RevLog 🏁

Vehicle maintenance tracker for car enthusiasts. Log services, track mods and fuel, never miss an oil change.

Built with React Native + Expo + Supabase.

## Beginner setup guide (start to finish)

### 1. Install the tools (one time)

1. Install **Node.js** (LTS version) from https://nodejs.org
2. Install the **Expo Go** app on your phone (App Store / Play Store)
3. Optional but recommended: **VS Code** from https://code.visualstudio.com

### 2. Create your Supabase backend (free)

1. Go to https://supabase.com and sign up
2. Click **New project** — name it `revlog`, pick a strong DB password, choose a region near you
3. Wait ~2 minutes for it to provision
4. Open **SQL Editor** (left sidebar) → **New query**
5. Copy the entire contents of `supabase/migrations/001_initial_schema.sql` from this project, paste it in, click **Run**
6. You should see "Success. No rows returned" — your database is ready

### 3. Connect the app to Supabase

1. In Supabase, go to **Settings → API**
2. Copy the **Project URL** and the **anon public** key
3. In this project folder, copy `.env.example` to a new file named `.env`
4. Paste your values into `.env`

### 4. Run the app

Open a terminal in this project folder:

```bash
npm install
npx expo start
```

A QR code appears. Scan it with your phone's camera (iPhone) or the Expo Go app (Android). The app opens on your phone. Edit any file, save, and it reloads instantly.

### 5. Try it out

1. Sign up with your email (check inbox for the confirmation link)
2. Sign in → add your first vehicle → log a service

## Project structure

```
app/                    Screens (Expo Router: file = route)
  _layout.tsx           Root layout + auth redirect logic
  (auth)/               Login and signup
  (tabs)/               Main tabs: Garage, Reminders, Settings
  vehicle/add.tsx       Add vehicle form (modal)
  vehicle/[id].tsx      Vehicle detail + service history
  log/add.tsx           Log a service (modal)
components/             Reusable UI pieces
constants/theme.ts      Colors and spacing (edit to restyle the app)
lib/supabase.ts         Supabase client
lib/types.ts            TypeScript types matching the database
supabase/migrations/    Database schema (run in Supabase SQL Editor)
```

## What to build next (in order)

1. **Add-reminder screen** — form like `log/add.tsx` writing to the `reminders` table (schema is ready)
2. **Vehicle photos** — use `expo-image-picker` (already installed) + Supabase Storage (`photos` bucket is already created)
3. **Push notifications** — `expo-notifications` to alert when reminders come due
4. **Fuel logging + MPG** — `fuel_logs` table is ready; MPG = miles between full tanks ÷ gallons
5. **Mods tracker** — `mods` table is ready
6. **Stats screen** — install `victory-native` for cost/MPG charts
7. **Ship it** — create an Expo account, then `npx eas build` + `npx eas submit`

## Tips for learning

- Change something small in `constants/theme.ts` and watch the app restyle live
- Every screen follows the same pattern: load data with `supabase.from(...)`, show it, save with `.insert(...)`
- Docs: https://docs.expo.dev · https://supabase.com/docs
- Stuck? Paste the error into Claude — include the file name
