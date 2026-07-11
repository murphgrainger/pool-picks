# PoolPicks Mobile

Expo SDK 54 + Expo Router 6 + React Native 0.81. iOS-first; Android is v1.1.

The mobile app talks to the same tRPC API as the web app (`apps/web/`) using Supabase Bearer tokens. For local dev, the phone needs to reach the web app over the LAN (or via an ngrok tunnel).

## Prerequisites

- Node 20+ and Yarn 1 (matches the monorepo's `packageManager` pin)
- Xcode 16+ with command line tools (for iOS simulator and native iOS builds)
- CocoaPods via Homebrew (`brew install cocoapods`) — the RVM Ruby + old CocoaPods route does not work with current pod specs
- Apple Developer account if you want to install on a physical device or build for TestFlight
- (Optional) `eas-cli` globally: `npm install -g eas-cli`

## Env vars

All mobile env vars live in the **repo root `/.env`** (not `apps/mobile/.env`). They're prefixed `EXPO_PUBLIC_*` so Expo's Metro bundler picks them up and bakes them into the JS bundle at start time.

Required:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_TRPC_URL=http://<your-mac-LAN-IP>:3000/api/trpc
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...apps.googleusercontent.com
```

> **`EXPO_PUBLIC_TRPC_URL`** must be a URL your phone can reach. On the same Wi-Fi network, use your Mac's LAN IP (e.g. `http://192.168.5.15:3000/api/trpc`). If LAN is unreliable, run `ngrok http 3000` and use the ngrok HTTPS URL instead.

After editing `.env`, restart Metro with `--clear` — `EXPO_PUBLIC_*` values are baked at bundle start, not hot-reloaded.

EAS builds (the binaries installed on your phone for native features) read env vars from EAS, **not** from your local `.env`. Mirror every `EXPO_PUBLIC_*` you set locally to https://expo.dev → poolpicks → Environment Variables, under all three environments (development, preview, production). Use **Plaintext** visibility for `EXPO_PUBLIC_*` — those values ship in the JS bundle anyway, so Secret is over-protection and prevents you from reading them back.

## Three dev loops

Pick the simplest one that works for what you're testing.

### 1. Expo Go on your phone — fastest, no native features

Best for daily UI/JS work. No Apple Sign In, no Google Sign In, no push notifications, no Universal Links.

```bash
yarn dev                          # terminal 1: web app for tRPC
cd apps/mobile && yarn start      # terminal 2: Metro
```

Scan the QR code with the iOS Camera app → open in Expo Go.

### 2. EAS development build + Metro — full native features

This is the standard daily dev loop on this project. You install the dev client binary on your phone once (via an EAS build link), then connect it to Metro for live JS reload.

```bash
yarn dev                          # terminal 1: web app for tRPC
cd apps/mobile && yarn start      # terminal 2: Metro
```

On your phone, open the **PoolPicks Dev** app. The dev launcher screen lists recent Metro URLs — tap to connect. If it auto-launches into the embedded bundle instead of the launcher, shake to open the dev menu → "Go home." If there's no dev menu, you installed a preview/production build by mistake (it has `developmentClient: false`) — reinstall a development build.

### 3. iOS Simulator — fallback, slow on Intel Macs

```bash
cd apps/mobile && npx expo run:ios --device "iPhone 17 Pro"
```

The explicit `--device` flag works around an Expo CLI / Xcode 16+ devicectl JSON-parse bug that misidentifies simulators as physical devices. On Intel Macs, the simulator runs translated under Rosetta and is slow — prefer a real phone.

## When you need to rebuild (EAS)

Run a new EAS dev-client build whenever you:

- Add or upgrade a package that contains native code (anything with an `ios/` directory or an Expo config plugin)
- Change `app.json` plugin entries, `iosUrlScheme`, `associatedDomains`, or the bundle ID
- Change anything under `apps/mobile/ios/`

JS-only changes (TS/TSX, styles, tRPC, etc.) don't need a rebuild — Metro handles them.

```bash
cd apps/mobile && eas build --profile development --platform ios
```

Takes ~15-25 min. When the build completes, the EAS page shows an install link. Install it on your phone, then connect to Metro as usual.

### EAS build profiles

| Profile | Use case | Dev menu | Bundle source |
|---|---|---|---|
| `development` | Daily dev on real phone | Yes | Metro (or embedded fallback) |
| `preview` | Internal share before TestFlight | No | Embedded |
| `production` | TestFlight / App Store | No | Embedded |

```bash
eas build --profile preview --platform ios       # internal share
eas build --profile production --platform ios    # TestFlight
```

## Project layout

```
apps/mobile/
  app/                # Expo Router routes
    (auth)/           # Sign-in (Email OTP + Apple + Google)
    (app)/            # Authed app (home, pool details, picks, admin)
    join/[code].tsx   # Universal Link target for /join/<code>
  components/         # Shared UI (spinner, theme)
  constants/theme.ts  # Color palette
  lib/                # supabase, trpc, auth-context, providers,
                      # apple-sign-in, google-sign-in, push-notifications
  app.json            # Expo config (plugins, native settings)
  eas.json            # EAS build profiles
```

## Troubleshooting

- **"Couldn't load your pools" on first launch.** Either the embedded bundle has stale env values or Metro isn't reachable. Confirm Metro is running, both devices are on the same Wi-Fi, and `EXPO_PUBLIC_TRPC_URL` points at a host your phone can reach.
- **Phone can't reach Metro after a Node version switch (nvm).** macOS firewall is per-binary-path; the new Node binary isn't in the allowlist. Run:
  ```bash
  sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add $(which node)
  sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp $(which node)
  ```
- **OTP email returns 502/404 in dev.** The Supabase dev project's Send Email Hook is wired to an ngrok URL that's gone stale. Restart `ngrok http 3000` and update the URL in Supabase dashboard → Auth → Hooks.
- **Native module errors after pulling new code.** A dependency added native code. Run a fresh `eas build --profile development --platform ios`.

## Production

- **Bundle ID:** `com.murphgrainger.poolpicks`
- **App Store listing:** name "PoolPicks", subtitle "Golf pools with your friends"
- **Universal Links:** `https://poolpicks.app/join/<code>` opens the app directly (via `apps/web/src/app/.well-known/apple-app-site-association/route.ts` + `associatedDomains` in `app.json`)
