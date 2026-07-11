import { Platform } from "react-native";

export const Palette = {
  cream: "#FAF9F6",
  black: "#1a1a1a",
  white: "#ffffff",
  green: {
    50: "#f0fdf4",
    100: "#dcfce7",
    300: "#86efac",
    500: "#22c55e",
    700: "#006747",
    900: "#004D35",
  },
  grey: {
    50: "#9ca3af",
    75: "#6b7280",
    100: "#e5e7eb",
    200: "#f3f4f6",
    300: "#d1d5db",
  },
  yellow: "#D4A017",
  gold: "#C8A951",
  scorecard: {
    bg: "#FAF9F6",
    line: "#d4d4d4",
    header: "#006747",
  },
} as const;

export const Colors = {
  light: {
    text: Palette.black,
    background: Palette.cream,
    card: Palette.white,
    border: Palette.grey[100],
    muted: Palette.grey[75],
    tint: Palette.green[700],
    accent: Palette.gold,
    danger: "#dc2626",
  },
  dark: {
    text: "#ECEDEE",
    background: "#0e1816",
    card: "#162421",
    border: "#1f2e2b",
    muted: "#9BA1A6",
    tint: Palette.green[300],
    accent: Palette.gold,
    danger: "#f87171",
  },
};

export const Fonts = Platform.select({
  ios: { sans: "system-ui", rounded: "ui-rounded", mono: "ui-monospace" },
  default: { sans: "normal", rounded: "normal", mono: "monospace" },
});
