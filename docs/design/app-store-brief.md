# PoolPicks — App Store Visual Asset Brief

## 1. Brand foundation (apply to every asset)

**Mood:** Premium country club. Restrained, slightly traditional, never loud. Think Augusta National program, Titleist packaging, Seamus Golf — confidence through quietness, not volume.

**Color palette (use these exact values):**

| Token | Hex | Use |
|---|---|---|
| Forest Green | `#006747` | Primary brand, large fields, mark fills |
| Gold | `#C8A951` | Accents only — hairlines, rule lines, small marks |
| Cream | `#FAF9F6` | Primary background, negative space |
| Ink | `#1a1a1a` | Body text |
| Mute | `#6b7280` | Secondary text |

**Type:** League Spartan (sans, weights 600–800) for the wordmark; Montserrat for caption headlines on screenshots. No third typeface.

**Subtle golf cues only:** A pin flag, a dimple texture, a fairway-stripe pattern, a hairline cup rim — at most one per asset. Never multiple golf motifs stacked. The product is a wagering pool, not a golf simulator.

**Things to avoid:**
- Bright/saturated greens (no Masters TV green, no AstroTurf)
- Gradients except very subtle paper/foil textures
- Sports-betting tropes (chrome, neon, gambling chips, dice)
- Cartoon golfers or mascots
- Drop shadows beyond 4–8% opacity

---

## 2. App icon — explore THREE concepts in parallel

Deliver each as a complete set so I can pick the winner.

**Common specs (all three concepts):**
- Master file: `1024×1024 PNG`, sRGB, **no transparency, no rounded corners** (iOS applies the mask)
- File name: `icon-{concept}-1024.png`
- Background must be opaque (no alpha channel) — iOS App Store Connect will reject if alpha present
- Must remain legible at 60×60 px (iPhone home screen) and 29×29 px (Settings)

### Concept A — "Pin Flag Monogram"
A stylized golf pin where the flag silhouette doubles as a serif "P." Flagstaff is gold hairline (`#C8A951`); flag is cream (`#FAF9F6`); field is forest green (`#006747`). The P-as-flag should be discoverable but not obvious — a "huh, that's clever" moment, not a riddle.

### Concept B — "Club-Crest Roundel"
A circular badge in the language of a country club crest. Forest-green field, fine gold filigree border (1–2 px equivalent at 1024), an embossed cream "PP" monogram in the center, optional "est. 2026" hairline beneath. Risk to avoid: looking like a wine label or a generic golf-club logo. Solve by keeping it geometric, not floral.

### Concept C — "Ball-in-Cup Negative Space"
A cream golf ball (with implied dimples, very subtle) cradled in a forest-green cup. The cup's rim is a thin gold ellipse. The P emerges from the negative space between the ball and the cup wall. Most distinctive at small sizes if the silhouette reads cleanly.

**Android adaptive variants (per chosen concept):**
- `android-icon-foreground-1024.png` — mark only on transparent bg, mark fits within centered 660×660 safe zone
- `android-icon-background-1024.png` — solid `#FAF9F6` (cream) or a very subtle dimple texture
- `android-icon-monochrome-1024.png` — pure white silhouette of mark on transparent (for Android 13+ themed icons)

---

## 3. Splash screen

**Layout:** Icon mark (chosen concept, ~280 px tall) centered on the canvas, with the "PoolPicks" wordmark stacked directly beneath (League Spartan 800, `#006747`, optical size ~64 at 2x).

**Spacing:** ~24 px between mark and wordmark. Both elements together sit at vertical optical center (slightly above geometric center — roughly 46% from top).

**Background:** Solid cream `#FAF9F6`.

**Dark mode variant:** Same layout but background `#0E1A14` (deep green-black), mark and wordmark in cream `#FAF9F6` with the gold accent retained.

**Deliverables:**
- `splash-mark-light.png` — 1024×1024, transparent background, mark+wordmark composite as a single PNG (Expo will center it)
- `splash-mark-dark.png` — same, light-on-dark version
- Designer should know: Expo splash uses `imageWidth: 360` (we'll bump from current 200) on a solid color background, no full-bleed image needed

---

## 4. App Store screenshots — marketed, captioned

**Format per panel:** Vertical canvas. Top ~28% is a marketing band (cream background, headline + 1-line subhead). Bottom ~72% is the device screenshot floating with a soft 4% shadow, bleeding off the bottom edge by ~120 px to feel "alive." A 2 px gold hairline separates the marketing band from the device area.

**Marketing band typography:**
- Headline: Montserrat 600, 96 pt, `#1a1a1a`, max 5 words
- Subhead: Montserrat 400, 36 pt, `#6b7280`, max 8 words
- Left-aligned, 80 px left margin

**Device sizes required (Apple, current):**

| Device | Resolution | Required? |
|---|---|---|
| iPhone 6.9" (16 Pro Max) | 1320×2868 | Required |
| iPhone 6.7" (15 Pro Max) | 1290×2796 | Required |
| iPad 13" (M4) | 2064×2752 | Required because `supportsTablet: true` |

**Panel sequence (5 panels, same for all device sizes):**

| # | Source screen | Headline | Subhead |
|---|---|---|---|
| 1 | Sign-in (`(auth)/sign-in.tsx`) | "Golf pools, done right." | "Run a pool with your crew in minutes." |
| 2 | Pool list (`(app)/index.tsx`) | "Every pool, one place." | "Live, locked, and upcoming — at a glance." |
| 3 | Pool detail / leaderboard (`(app)/pool/[id]/index.tsx`) | "Live scores. Every five minutes." | "See who's winning in real time." |
| 4 | Picks (`(app)/pool/[id]/picks.tsx`) | "Pick five. Best four count." | "Draft your roster, lock it in." |
| 5 | Admin (`(app)/pool/[id]/admin.tsx`) | "You're the commissioner." | "Invite the crew, run the show." |

**File naming:** `screenshot-{device}-{##}-{slug}.png`
e.g. `screenshot-iphone69-01-signin.png`, `screenshot-ipad13-03-leaderboard.png`

**Source screenshots:** Real device captures provided separately at `docs/design/screenshots-raw/`. The design AI's job is the marketing-band composition around them, not redrawing the UI.

---

## 5. Notification icon (Android push, future-proofing)

- `notification-icon-96.png` — 96×96, white silhouette of mark on transparent, Android status-bar style
- Not required for iOS (uses app icon)

---

## 6. Favicon (already exists, replace with new mark)

- `favicon.png` — 512×512, full-color mark on cream, opaque
- `favicon.ico` — multi-resolution (16, 32, 48)

---

## 7. Deliverable summary (checklist for the design engine)

```
/icon
  ├── icon-A-pinflag-1024.png          (1024×1024, no alpha)
  ├── icon-B-crest-1024.png            (1024×1024, no alpha)
  ├── icon-C-ballincup-1024.png        (1024×1024, no alpha)
  └── /android (for chosen concept)
      ├── android-icon-foreground-1024.png
      ├── android-icon-background-1024.png
      └── android-icon-monochrome-1024.png

/splash
  ├── splash-mark-light.png            (1024×1024, transparent)
  └── splash-mark-dark.png             (1024×1024, transparent)

/screenshots
  ├── /iphone-6.9   (5 panels, 1320×2868)
  ├── /iphone-6.7   (5 panels, 1290×2796)
  └── /ipad-13      (5 panels, 2064×2752)

/web
  ├── favicon.png                       (512×512)
  └── favicon.ico                       (multi-res)

/notification
  └── notification-icon-96.png          (96×96, white-on-transparent)
```

---

## 8. Out of scope for this round

- App Preview videos (15–30s) — defer to v1.1
- Google Play feature graphic (1024×500) — Android is v1.1
- App Store listing copy (description, keywords) — separate writing pass
- In-app illustrations / empty states — separate pass once mark is approved
