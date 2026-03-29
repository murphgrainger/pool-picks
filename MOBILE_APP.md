# Mobile App Plan

A comprehensive implementation plan for adding a React Native mobile app to Pool Picks. This document is a living roadmap — update it as decisions evolve.

---

## Prerequisites (Complete on Web First)

Before starting mobile development, finish these on the web app:

### 1. Auth Overhaul
- **Replace magic links with Email OTP** — users enter email, receive a 6-digit code, type it in-app. No link-clicking or app-switching. Supabase supports this via `signInWithOtp()`.
- **Add Apple Sign In** — required by the App Store when you offer Google OAuth. Add alongside the existing Google button.
- **Keep Google OAuth** — no changes needed.
- **Result:** Sign-in screen shows Google + Apple buttons up top, "Sign in with email" below (OTP flow).

### 2. Invite Codes
- The `Pool` schema already has an `invite_code` field (`String?`). Wire it up:
  - Generate a short code (e.g., `POOL-ABC123`) on pool creation
  - Add a "Join by Code" flow — user enters code, gets added to pool
  - Keep existing email invites alongside the code
  - Shareable via text/iMessage on mobile (more natural than email for casual pools)

### 3. Other Web Polish
- Items from the Notion doc (TBD by user)

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Expo** (managed workflow, SDK 52+) | No Xcode/Android Studio needed. OTA updates, push notifications, EAS Build built in. Can eject later. |
| Routing | **Expo Router v4** (file-based) | Mirrors the Next.js App Router pattern. Deep linking comes free. |
| Styling | **NativeWind v4** | Reuse the exact Tailwind class names and color palette from `@pool-picks/tailwind-config`. |
| Auth | **Supabase JS + AsyncStorage** | Standard mobile pattern. Google + Apple Sign In + Email OTP. No SSR/cookies needed. |
| API | **tRPC client** → deployed Next.js `/api/trpc` | Full type safety via `AppRouter` from `@pool-picks/api`. Bearer token auth. |
| Data fetching | **TanStack React Query** (via tRPC) | Already used on web. Caching, background refetch, optimistic updates. |
| State | React Query + React Context (auth) | No Redux or Zustand needed. |

### Package Reuse

| Package | Mobile Usage | Import |
|---|---|---|
| `@pool-picks/utils` | Full reuse — scoring, formatting, sorting, constants, pool phases | Runtime |
| `@pool-picks/api` | `AppRouter` type for tRPC client inference | Type-only (`import type`) |
| `@pool-picks/db` | **Never imported directly** — types flow through `AppRouter` | None |
| `@pool-picks/tailwind-config` | Color palette extended by NativeWind config | Build-time |
| `@pool-picks/typescript-config` | `react-native.json` base config (already exists) | Build-time |

---

## Phase 0: Project Setup

### 0.1 File Structure

```
apps/mobile/
  app.json                          # Expo config (name, scheme, plugins)
  babel.config.js                   # Babel config for NativeWind
  metro.config.js                   # Metro bundler — monorepo resolution
  nativewind-env.d.ts               # NativeWind type declarations
  package.json
  tsconfig.json                     # Extends react-native.json
  tailwind.config.ts                # Extends @pool-picks/tailwind-config
  global.css                        # @tailwind directives
  app/
    _layout.tsx                     # Root layout (providers, auth gate)
    (auth)/
      _layout.tsx                   # Auth group layout (no nav)
      sign-in.tsx                   # Sign-in screen
    (tabs)/
      _layout.tsx                   # Tab bar layout
      index.tsx                     # Home — invites + pool list
      create.tsx                    # Create Pool
      profile.tsx                   # Profile / Settings
    pool/
      [id]/
        index.tsx                   # Pool detail
        picks.tsx                   # Pick athletes
  src/
    lib/
      supabase.ts                   # Supabase client (AsyncStorage)
      trpc.ts                       # tRPC client + provider
      auth.tsx                      # Auth context + hook
    components/
      PoolCard.tsx                  # Pool list card
      PoolMemberCard.tsx            # Member w/ score + expandable picks
      PickCard.tsx                  # Individual athlete pick
      InviteCard.tsx                # Pending invite (accept/decline)
      StatusBadge.tsx               # Pool/tournament status pill
      CommissionerPanel.tsx         # Commissioner actions sheet
      AthleteSelector.tsx           # Bottom sheet athlete picker
      Spinner.tsx                   # Loading spinner
```

### 0.2 Dependencies

```json
{
  "dependencies": {
    "@pool-picks/api": "*",
    "@pool-picks/utils": "*",
    "@supabase/supabase-js": "^2.47.0",
    "@tanstack/react-query": "^5.62.0",
    "@trpc/client": "^11.0.0-rc.608",
    "@trpc/react-query": "^11.0.0-rc.608",
    "@react-native-async-storage/async-storage": "^2.1.0",
    "@gorhom/bottom-sheet": "^5.0.0",
    "expo": "~52.0.0",
    "expo-auth-session": "~6.0.0",
    "expo-haptics": "~14.0.0",
    "expo-linking": "~7.0.0",
    "expo-notifications": "~0.29.0",
    "expo-router": "~4.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-web-browser": "~14.0.0",
    "nativewind": "^4.0.0",
    "react": "^18.3.0",
    "react-native": "0.76.0",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-safe-area-context": "^4.14.0",
    "react-native-screens": "~4.4.0",
    "superjson": "^2.2.1",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@pool-picks/tailwind-config": "*",
    "@pool-picks/typescript-config": "*",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.6.0"
  }
}
```

### 0.3 Metro Config (Monorepo)

Metro doesn't natively understand Yarn workspaces. This is the most common source of "module not found" errors.

```js
// apps/mobile/metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the shared packages
config.watchFolders = [monorepoRoot];

// Resolve modules from both local and root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = withNativeWind(config, { input: "./global.css" });
```

**Critical:** The mobile app must never import `@pool-picks/db` at runtime. Prisma Client requires Node.js APIs that don't exist in React Native. Types flow through `@pool-picks/api`'s `AppRouter` type at compile time only. Use `import type { AppRouter }` to ensure no runtime import.

### 0.4 Tailwind / NativeWind Config

```ts
// apps/mobile/tailwind.config.ts
import type { Config } from "tailwindcss";
import sharedConfig from "@pool-picks/tailwind-config";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}"],
  presets: [sharedConfig],
};
export default config;
```

This gives the mobile app the same color palette:
- Greens: `#B7E3B5`, `#A3DBA0`, `#05762C`, `#034E1E`
- Black: `#181818`
- Greys: `#E6E4E4`, `#7e8599`, `#666B7A`, `#3D4451`
- Yellow: `#EDEC32`

Note: The shared config includes `@tailwindcss/typography` and `@tailwindcss/forms` plugins which are web-only. NativeWind ignores unsupported plugins, but if this causes build issues, override the `plugins` array to `[]` in the mobile config.

### 0.5 TypeScript Config

```json
// apps/mobile/tsconfig.json
{
  "extends": "@pool-picks/typescript-config/react-native.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"],
  "exclude": ["node_modules"]
}
```

Extends the existing `packages/typescript-config/react-native.json` which has `jsx: "react-native"`, `target: "ESNext"`, `moduleResolution: "bundler"`.

### 0.6 Turborepo Integration

Add to `turbo.json`:
```json
{
  "tasks": {
    "dev:mobile": {
      "cache": false,
      "persistent": true,
      "dependsOn": ["^build"]
    }
  }
}
```

Add to root `package.json` scripts:
```json
{
  "dev:mobile": "turbo dev:mobile --filter=@pool-picks/mobile"
}
```

### 0.7 Environment Variables

```
# apps/mobile/.env (gitignored)
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_API_URL=https://pool-picks.vercel.app
```

Expo uses `EXPO_PUBLIC_` prefix (not `NEXT_PUBLIC_`). The API URL points to the deployed Next.js app.

### 0.8 App Config

```json
// apps/mobile/app.json
{
  "expo": {
    "name": "Pool Picks",
    "slug": "pool-picks",
    "scheme": "poolpicks",
    "version": "1.0.0",
    "orientation": "portrait",
    "platforms": ["ios", "android"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.poolpicks.app",
      "usesAppleSignIn": true
    },
    "android": {
      "package": "com.poolpicks.app",
      "adaptiveIcon": {
        "backgroundColor": "#181818"
      }
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      "expo-apple-authentication",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#A3DBA0"
        }
      ]
    ]
  }
}
```

---

## Phase 1: Authentication

### 1.1 Supabase Client

```ts
// apps/mobile/src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // we handle deep links manually
    },
  }
);
```

### 1.2 Auth Context

```tsx
// apps/mobile/src/lib/auth.tsx
import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthContext {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContext>(/* ... */);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore persisted session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      isLoading,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 1.3 Server-Side Change: Bearer Token Auth in tRPC

**File to modify: `apps/web/src/app/api/trpc/[trpc]/route.ts`**

This is the **only change needed in the web app** for mobile API access. The current handler reads auth from cookies. Add a Bearer token fallback for mobile:

```ts
createContext: async () => {
  const supabase = createRouteHandlerClient();
  let supabaseUser = (await supabase.auth.getUser()).data.user;

  // Fallback: Bearer token from mobile clients
  if (!supabaseUser) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { createClient } = await import("@supabase/supabase-js");
      const anonClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await anonClient.auth.getUser(token);
      supabaseUser = data.user ?? null;
    }
  }

  // ... rest unchanged (lookup dbUser, return context)
}
```

Backwards compatible — web requests still use cookies, mobile sends `Authorization: Bearer <access_token>`.

### 1.4 Sign-In Screen

**File: `apps/mobile/app/(auth)/sign-in.tsx`**

Three auth options:

**Google OAuth:**
1. Call `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: "poolpicks://auth/callback" } })`
2. Open the returned URL via `expo-web-browser` (`WebBrowser.openAuthSessionAsync`)
3. On redirect back, extract tokens from the URL fragment
4. Call `supabase.auth.setSession()` with the tokens

**Apple Sign In (iOS only):**
1. Use `expo-apple-authentication` to get Apple credential
2. Call `supabase.auth.signInWithIdToken({ provider: "apple", token: credential.identityToken })`
3. Session is set automatically

**Email OTP:**
1. User enters email
2. Call `supabase.auth.signInWithOtp({ email })` — Supabase sends a 6-digit code
3. Show a code input screen
4. On submit, call `supabase.auth.verifyOtp({ email, token: code, type: "email" })`
5. Session is set automatically

**Supabase dashboard config required:**
- Add `poolpicks://auth/callback` to Authentication > URL Configuration > Redirect URLs
- Enable Apple provider in Authentication > Providers
- Enable Email OTP (disable magic links) in Authentication > Providers > Email

### 1.5 Navigation Guards

```tsx
// apps/mobile/app/_layout.tsx
import { useAuth, AuthProvider } from "@/lib/auth";
import { Redirect, Stack } from "expo-router";

function RootLayoutNav() {
  const { session, isLoading } = useAuth();

  if (isLoading) return <SplashScreen />;
  if (!session) return <Redirect href="/(auth)/sign-in" />;

  return <Stack />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <TRPCProvider>
        <RootLayoutNav />
      </TRPCProvider>
    </AuthProvider>
  );
}
```

---

## Phase 2: Core Screens

### 2.1 tRPC Client

```ts
// apps/mobile/src/lib/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@pool-picks/api";
import { supabase } from "./supabase";

export const trpc = createTRPCReact<AppRouter>();

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${process.env.EXPO_PUBLIC_API_URL}/api/trpc`,
        transformer: superjson,
        async headers() {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return token ? { authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}
```

Key: `superjson` transformer must match the server. Dates (tournament dates, timestamps) are serialized/deserialized correctly.

### 2.2 Tab Bar Layout

```tsx
// apps/mobile/app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: "#A3DBA0",      // green-500
      tabBarInactiveTintColor: "#7e8599",     // grey-75
      tabBarStyle: { backgroundColor: "#181818" }, // black
    }}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="create" options={{ title: "Create Pool" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
```

### 2.3 Home Dashboard — `app/(tabs)/index.tsx`

**Mirrors:** `apps/web/src/components/pool/InviteActions.tsx`

**tRPC queries:**
- `trpc.poolInvite.listPending.useQuery()` — pending invites
- `trpc.poolMember.listByUser.useQuery()` — user's pools with rank/score

**Layout:**
1. **Pending invites** — Yellow cards at top. Pool name, tournament, entry amount. Accept / Decline buttons.
2. **Pool groups** — Grouped by effective phase (live > locked-awaiting > open > setup). Each group has a header with a status badge.
3. **Pool cards** — Touchable → navigates to `/pool/[id]`. Shows pool name, tournament dates (via `formatTournamentDates`), entry amount. Active pools show rank (via `ordinalSuffix`) and score (via `formatToPar`).
4. **Completed pools** — Collapsible section at bottom.
5. **Empty state** — "You currently aren't in any active pools."
6. **Pull-to-refresh** — `RefreshControl` wired to `refetch()`.

**Reused from `@pool-picks/utils`:**
- `formatTournamentDates(start, end)`
- `formatToPar(score)`
- `ordinalSuffix(position)`
- `getEffectivePoolPhase(poolStatus, tournamentStatus)`
- `sortPoolMembersByPoolStatus(members)`

### 2.4 Pool Detail — `app/pool/[id]/index.tsx`

**Mirrors:** `apps/web/src/components/pool/PoolDetailClient.tsx`

**tRPC queries:**
- `trpc.pool.getById.useQuery({ id })`
- `trpc.pool.getScores.useQuery({ pool_id })` — for refresh

**Scoring logic (reused from `@pool-picks/utils`):**
- `reformatPoolMembers(pool.pool_members, pool.tournament_id)` — formats raw data into `PoolMemberFormatted[]` with calculated positions
- `calculateMemberPosition(members)` — ranks with tie handling

**Layout:**
1. **Header** — Pool name, tournament, course, dates, entry amount, total pot. "ESPN Leaderboard" link (via `Linking.openURL`).
2. **Refresh button** — Calls scrape endpoint, refetches scores. Shows `timeAgo(lastUpdated)`. Visible when pool phase is `live`.
3. **Status card** — Contextual message per pool phase.
4. **Commissioner panel** — Only if current user is commissioner. Bottom sheet with:
   - Pool status selector
   - Invite form (email + invite code sharing)
   - Confirmation for status transitions
5. **Member list** — `FlatList` of member cards showing position, username, score. Expandable picks accordion.
6. **Invite section** — Pending invites listed below members.

**Note:** The web app calls `/api/scrape/tournaments/${id}/scores` directly for the refresh button. Mobile must call the same endpoint on the deployed server, including the Bearer token.

### 2.5 Create Pool — `app/(tabs)/create.tsx`

**Mirrors:** `apps/web/src/app/pool/create/page.tsx`

**tRPC queries:**
- `trpc.tournament.listSelectable.useQuery()` — future tournaments
- `trpc.pool.create.useMutation()`

**Layout:**
1. Pool name text input
2. Tournament selector — bottom sheet (`@gorhom/bottom-sheet`) with searchable `FlatList`. Shows tournament name + `formatTournamentDates`.
3. Entry amount input (numeric keyboard, `keyboardType="number-pad"`)
4. Commissioner nickname input
5. Submit button → navigates to `/pool/[id]` on success

**Replace `react-select`:** The web uses `react-select` for dropdowns. On mobile, use `@gorhom/bottom-sheet` with a filtered `FlatList` instead — native feel, better performance.

### 2.6 Pick Athletes — `app/pool/[id]/picks.tsx`

**Mirrors:** `apps/web/src/components/picks/PicksCreateForm.tsx`

**tRPC queries:**
- `trpc.athlete.listByTournament.useQuery({ tournament_id })`
- `trpc.poolMember.submitPicks.useMutation()`

**Layout:**
1. Rules card — "Pick 6, Use 4" explanation. Max 3 from A Group (top 20 OWGR). Uses `PICKS_PER_MEMBER`, `SCORING_PICKS`, `MAX_A_GROUP_PICKS` from `@pool-picks/utils`.
2. Six pick slots — Tap to open bottom sheet with searchable athlete list. Athletes with `ranking <= 20` show "(A Group)" tag.
3. Selected athletes list with swipe-to-remove or X button.
4. Submit button — validates exactly 6 picks, max 3 A Group.
5. Error states for validation failures.

### 2.7 Username Form

Shown inline on Pool Detail when the current user hasn't set a username yet. Simple text input + submit.

**tRPC mutation:** `trpc.poolMember.updateUsername.useMutation()`

### 2.8 Profile Tab — `app/(tabs)/profile.tsx`

Not in the web app currently. Mobile-specific screen for:
- User email display
- Sign out button
- App version

---

## Phase 3: Push Notifications

### 3.1 Schema Change

Add to `packages/db/prisma/schema.prisma`:

```prisma
model PushToken {
  id         Int      @id @default(autoincrement())
  token      String   @unique
  user_id    String
  user       User     @relation(fields: [user_id], references: [id])
  created_at DateTime @default(now())
}
```

Update `User` model:
```prisma
push_tokens PushToken[]
```

### 3.2 New tRPC Endpoint

Add a `user` router or extend an existing router with:
- `registerPushToken` (protectedProcedure) — upserts the device push token

### 3.3 Token Registration

On app launch after auth, request permissions and register:
```ts
import * as Notifications from "expo-notifications";

const { status } = await Notifications.requestPermissionsAsync();
if (status === "granted") {
  const token = await Notifications.getExpoPushTokenAsync();
  trpc.user.registerPushToken.mutate({ token: token.data });
}
```

### 3.4 Server-Side Push Sends

Create `packages/api/src/lib/push.ts` (similar to existing `email.ts`):
- Uses Expo Push API (`https://exp.host/--/api/v2/push/send`)
- Called from tRPC mutations at these trigger points:

| Event | Trigger | Recipient |
|---|---|---|
| Pool invite created | `poolInvite.create` mutation | Invitee (if they have a push token) |
| Pool opened | `pool.updateStatus` → Open | All pool members |
| Tournament goes live | Score scrape detects first scores | All members in pools for that tournament |
| Pool completed | `pool.updateStatus` → Complete | All pool members |

### 3.5 Notification Tap Handling

In root layout, configure notification response handler to deep link:
- Pool invite → Home dashboard (`/(tabs)/`)
- Pool status change → Pool detail (`/pool/[id]`)

---

## Phase 4: Polish & Release

### 4.1 Haptic Feedback

Using `expo-haptics`:
- Accept/decline invite → `Haptics.notificationAsync(Success)`
- Submit picks → `Haptics.notificationAsync(Success)`
- Pull-to-refresh → `Haptics.impactAsync(Light)`
- Error → `Haptics.notificationAsync(Error)`

### 4.2 Offline Support / Caching

TanStack Query caches responses automatically. Configure:
```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 min default
      gcTime: 30 * 60 * 1000,    // 30 min garbage collection
    },
  },
});
```

For true offline, add `@tanstack/react-query-persist-client` with an AsyncStorage adapter — shows stale data when offline, syncs on reconnect.

### 4.3 Universal Links (Magic Link Replacement)

Once web auth is updated to Email OTP, universal links are less critical (no magic link to intercept). However, they're still useful for:
- Sharing pool links that open directly in the app
- Future invite code deep links

**iOS:** Add `apple-app-site-association` to `apps/web/public/.well-known/`
**Android:** Add `assetlinks.json` to `apps/web/public/.well-known/`

### 4.4 App Store / Play Store Submission

**EAS Build setup:**
```bash
npx eas init
npx eas build:configure
# Creates eas.json with development, preview, production profiles
```

**Build & submit:**
```bash
npx eas build --platform all --profile production
npx eas submit --platform ios
npx eas submit --platform android
```

**App Store requirements:**
- App icon (1024x1024)
- Screenshots for iPhone, iPad (if supporting tablet)
- Privacy policy URL
- App description and keywords

---

## Server-Side Changes Summary

Only two server changes are needed. Everything else is mobile-only.

| Change | Phase | File | Description |
|---|---|---|---|
| Bearer token auth | Phase 1 | `apps/web/src/app/api/trpc/[trpc]/route.ts` | ~15 lines: fallback to `Authorization: Bearer` header when no cookie session found |
| Push token schema | Phase 3 | `packages/db/prisma/schema.prisma` | New `PushToken` model + relation on `User` |

---

## Known Gotchas

### Metro + Monorepo
Metro's module resolver doesn't natively understand Yarn workspaces. The `metro.config.js` must explicitly set `watchFolders` (monorepo root) and `nodeModulesPaths` (both local and root `node_modules`). This is the #1 source of "module not found" errors during setup.

### Prisma Client in Metro
If Metro tries to bundle `@pool-picks/db` at runtime (via transitive imports), it will crash — `@prisma/client` requires Node.js APIs. The mobile app must **only** use `import type { AppRouter }` from `@pool-picks/api`. No runtime imports from `db` package.

### react-select Replacement
The web app uses `react-select` for tournament selection, athlete picking, and status dropdowns. React Native has no equivalent. Use `@gorhom/bottom-sheet` with a filtered `FlatList` for each of these.

### NativeWind v4 Setup
NativeWind v4 uses a PostCSS-based pipeline different from v2. Requires specific Babel and Metro configuration. Follow the NativeWind v4 docs carefully — the `withNativeWind` Metro wrapper and `nativewind/babel` preset are both required.

### Tailwind Plugin Compatibility
The shared config includes `@tailwindcss/typography` and `@tailwindcss/forms` — these are web-only plugins. NativeWind ignores them, but if build errors occur, override `plugins: []` in the mobile config.

### Hermes Engine + Intl
React Native uses the Hermes JS engine, which has limited `Intl` API support. The `formatTournamentDates` and `formattedDate` utilities in `@pool-picks/utils` use `toLocaleDateString` and `toLocaleString`. Test on both platforms — if formatting breaks, install `expo-localization` or a polyfill.

### superjson Transformer
The tRPC API uses `superjson` for serialization (handles `Date` objects). The mobile tRPC client **must** also specify `superjson` as its transformer — otherwise dates come back as strings and comparisons break.

---

## Testing Strategy

### Unit Tests
- Continue using Vitest for `@pool-picks/utils` (scoring, formatting, pool phases)
- Add tests for any new shared logic (push notification helpers, invite code generation)

### Component Tests
- React Native Testing Library (`@testing-library/react-native`)
- Focus: auth flow, pick submission validation, invite accept/decline, pull-to-refresh

### E2E Tests
- **Maestro** (recommended) or Detox for end-to-end flows
- Key flows: sign in (OTP), view pools, accept invite, submit picks, refresh scores

### Manual Testing
- Expo Go for rapid development iteration
- EAS development builds for testing native modules (push notifications, Apple Sign In)
- Test on: iPhone (various sizes), iPad, Android phone, Android tablet

---

## Screen Map

| Mobile Screen | Web Equivalent | Key Components |
|---|---|---|
| `(auth)/sign-in` | `auth/sign-in/page.tsx` | Google + Apple + Email OTP |
| `(tabs)/index` | `page.tsx` + `InviteActions.tsx` | InviteCard, PoolCard, StatusBadge |
| `(tabs)/create` | `pool/create/page.tsx` | AthleteSelector (bottom sheet) |
| `(tabs)/profile` | _(header menu on web)_ | Sign out, user info |
| `pool/[id]` | `pool/[id]/page.tsx` + `PoolDetailClient.tsx` | PoolMemberCard, PickCard, CommissionerPanel |
| `pool/[id]/picks` | `PicksCreateForm.tsx` | AthleteSelector, validation |

---

## Open Questions

- [ ] App name — "Pool Picks" or something else for the stores?
- [ ] App icon and splash screen design
- [ ] Whether to support iPad / Android tablet layouts or phone-only
- [ ] Invite code format — short alphanumeric (e.g., `ABC123`) vs longer UUID-style?
- [ ] Push notification copy and frequency — how often to nudge about score updates?
- [ ] Whether to add a "Recent Activity" or notification inbox screen
