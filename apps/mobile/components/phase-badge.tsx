import { StyleSheet, Text, View } from "react-native";
import type { PoolPhase } from "@pool-picks/utils";

import { Palette } from "@/constants/theme";

const phaseStyles: Record<PoolPhase, { bg: string; fg: string; label: string }> = {
  setup: { bg: "#dbeafe", fg: "#1d4ed8", label: "Setup" },
  open: { bg: `${Palette.gold}33`, fg: Palette.yellow, label: "Open" },
  "locked-awaiting": { bg: "#fee2e2", fg: "#b91c1c", label: "Locked" },
  live: { bg: Palette.green[100], fg: Palette.green[700], label: "Live" },
  completed: { bg: Palette.grey[200], fg: Palette.grey[75], label: "Complete" },
};

export function PhaseBadge({ phase }: { phase: PoolPhase }) {
  const s = phaseStyles[phase];
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Text style={[styles.label, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  label: { fontSize: 12, fontWeight: "600" },
});
