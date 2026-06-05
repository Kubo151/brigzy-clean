# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Brigzy** is a job/gig marketplace mobile app (React Native + Expo SDK 54, TypeScript) connecting workers and employers, targeted at the Slovak market. UI strings and several hard-coded error messages are in Slovak.

## Commands

```bash
npx expo start --clear          # Start Metro dev server (use --clear after config changes)
# then press 'a' for Android emulator, 'i' for iOS simulator

npx tsc --noEmit                # Type-check the whole project (strict mode is on)
node check.js                   # Transpile-check a hard-coded subset of files (smoke test)

npm install <pkg> --legacy-peer-deps   # ALWAYS use --legacy-peer-deps (React 19 peer conflicts)
```

There is **no test runner, linter, or formatter** configured. `npx tsc --noEmit` is the only correctness gate.

When build/cache issues appear, clear caches: remove `node_modules/.cache` and `.expo`, then `npx expo start --clear --reset-cache`.

## Environment

`.env` (gitignored) must define `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` — `src/lib/supabase.ts` throws on startup if either is missing. Client-exposed vars must use the `EXPO_PUBLIC_` prefix.

## Architecture

**Routing** — Expo Router (file-based) under `src/app/`. `expo-router/entry` is the app entry. The `@/*` → `src/*` path alias is configured in **both** `tsconfig.json` (paths) and `metro.config.js` (resolver.alias) — keep them in sync. `src/app/index.tsx` is a session gate that redirects to `/home` or `/login`. `(tabs)/` holds the tab navigator with a custom glass `FloatingTabBar` (`(tabs)/_layout.tsx`).

> Note: legacy flat screens (`home.tsx`, `account.tsx`, `job-detail.tsx`) coexist with newer dynamic routes (`job/[id].tsx`, `(tabs)/account.tsx`, `apply/[id].tsx`). When changing a screen, confirm which route actually renders before editing.

**Backend** — Supabase (`@supabase/supabase-js`). Real data lives in Supabase tables: `users` (the profile table — **not** `profiles` as older docs claim), `jobs`, `applications`, `saved_jobs`, `messages`, plus an `avatars` storage bucket. Profile row creation on signup happens in `src/app/login.tsx`, **not** in `auth-store.signUp` (creating it in both causes duplicate-key errors).

**State (Zustand, `src/lib/state/`)** — multiple stores, three persisted to AsyncStorage under distinct keys:
- `auth-store.ts` — Supabase session/user + signIn/signUp/signOut (Slovak error strings). Not persisted; rehydrates from Supabase.
- `app-store.ts` — persisted (`brigzy-storage`): `currentRole`, `savedJobIds` (synced to `saved_jobs` table), `appliedJobIds`, role-selection flag.
- `theme-store.ts` — persisted (`brigzy-theme-storage`): `themeMode`, `language`, notifications.
- `jobs-store.ts` — persisted (`brigzy-global-jobs`): local-only job list; mostly legacy, the live feed reads the Supabase `jobs` table.

Session state is tracked in three places independently (auth-store, root `_layout.tsx`, and `index.tsx`) — they each subscribe to `supabase.auth`.

**Theming** — `useColors()` returns a full `DARK`/`LIGHT` palette object (iOS-26-style tokens: `bg`, `surface`, `purple`, glass materials, etc.), selected from `theme-store.themeMode` + system scheme. Use these palette tokens for colors. `useColorScheme()` returns just `'light' | 'dark'`. Components mostly use React Native `StyleSheet` + palette tokens; NativeWind v4 / Tailwind v4 is wired up (babel `jsxImportSource: 'nativewind'`, `cn()` helper in `src/lib/cn.ts`) but used sparingly.

**Internationalization — two parallel systems (gotcha)**, both reading `language` from `theme-store`:
- `useText()` → `texts.ts`: plain object of strings, languages `en`/`sk`. Preferred in newer screens.
- `useI18n()` → `translations.ts`: `t('dotted.key')` lookup, languages `en`/`es`/`fr`/`de`/`sk`.

When adding strings, match whichever system the surrounding screen already uses.

**UI libraries in active use** — `lucide-react-native` icons and `react-native-reanimated` (babel plugin enabled) ARE used (e.g. the tab bar), plus `expo-blur`, `expo-haptics`, `expo-linear-gradient`. Older handoff notes saying these were removed are outdated.

## Notes

`HANDOFF.md`, `HOME-SCREEN-UPGRADE.md`, and `FAVORITES-IMPLEMENTATION.md` are historical dev notes and are partially stale (wrong table names, "removed" libs that are now present). Trust the code over those docs.
