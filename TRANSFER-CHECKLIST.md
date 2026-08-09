# Before selling this MacBook

Work top to bottom. Don't erase anything until Part 1 is fully done.

---

## Part 1 — Get the project off this Mac

### 1. Push everything to GitHub

```bash
cd ~/Desktop/revlog
git status
```

If it lists any changes:

```bash
git add -A
git commit -m "Final state before Mac transfer"
git push
```

Confirm it worked — open https://github.com/Sotarres1/revlog in a browser and check
your latest commit is there. **If it's on GitHub, the code is safe** regardless of
what happens to this machine.

### 2. Save the one file that isn't in git

`.env` is gitignored, so it is *not* on GitHub. Open it:

```bash
cat ~/Desktop/revlog/.env
```

Copy both lines into your password manager or a note synced to iCloud.

> Not a disaster if you lose it — the same values are in `eas.json` (which *is* on
> GitHub) and in the Supabase dashboard under Settings → API. But saving 30 seconds
> now beats hunting later.

### 3. Copy the whole folder as a backup

Belt and braces. Drag `~/Desktop/revlog` to an external drive or iCloud Drive.

**Skip `node_modules`** — it's ~30,000 files, takes forever, and gets reinstalled
anyway. Easiest is to delete it first:

```bash
rm -rf ~/Desktop/revlog/node_modules
```

Then copy the folder. It'll be small and fast.

---

## Part 2 — Save your account access

You cannot rebuild the app without these. Put every one in a password manager
before you wipe anything.

- [ ] **Expo** — `@2tuff113` (you reset this password on 8 Aug 2026 — make sure the
      new one is saved)
- [ ] **Supabase** — the account holding project `qcxkmzmyvfxlwvgmjkxk`
- [ ] **GitHub** — `Sotarres1`. Also save the Personal Access Token, or just
      generate a fresh one on the new Mac
- [ ] **Apple Developer** — Apple ID for team `2NA2LW2AL9`, plus wherever your 2FA
      goes. **If 2FA only reaches this Mac, fix that first** — add your iPhone as a
      trusted device or you can lose account access entirely
- [ ] **revlog.app@gmail.com** — the app's public support inbox
- [ ] **App Store Connect** — same Apple ID, but confirm you can actually sign in

> The Apple Developer account is the one to be careful with. Losing it means losing
> the app listing, its reviews, and the bundle ID. Everything else is replaceable.

---

## Part 3 — Sign out and wipe

Only after Parts 1 and 2 are complete.

1. **Sign out of iCloud** — System Settings → your name → Sign Out
2. **Sign out of iMessage** — Messages → Settings → iMessage → Sign Out
3. **Turn off Find My Mac** — happens with the iCloud sign-out; verify it did
4. **Deauthorize any media apps** if you use them
5. **Erase All Content and Settings** — System Settings → General → Transfer or
   Reset → Erase All Content and Settings

That last option wipes cleanly and reinstalls macOS fresh. Don't hand the machine
over still signed into your Apple ID — activation lock will make it useless to the
buyer and they'll come back to you.

---

## Part 4 — On the new Mac

Read **`HANDOFF.md`** first, then **`SETUP-NEW-MAC.md`**.

If you're using Claude again, the fastest start is to connect the `revlog` folder
and say:

> "Read HANDOFF.md — this is my iOS app project and I'm picking it back up on a new
> Mac."

That gives it everything it needs without you re-explaining any of it.

---

## While you're between machines

**Open RevLog on your phone every few days.** The Supabase free tier pauses after 7
idle days, and a paused database is what got the app rejected the first time. If
you're mid-review with no Mac, that phone tap is the only thing keeping it alive.

Upgrading to Supabase Pro removes the problem entirely and is worth doing before you
sell, since you won't have a machine to fix things from for a while.
