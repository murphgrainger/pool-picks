import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatToPar, type AthletePlayerView } from "@pool-picks/utils";

import { Colors, Palette } from "@/constants/theme";

type Props = {
  athlete: AthletePlayerView;
};

export function PlayerCard({ athlete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isCutOrWD = athlete.status === "CUT" || athlete.status === "WD";
  const positionDisplay = isCutOrWD
    ? athlete.status
    : athlete.position != null
    ? String(athlete.position)
    : "—";
  const scoreDisplay = formatToPar(athlete.score_under_par) ?? "—";
  const thruIsTeeTime =
    athlete.thru !== null &&
    (athlete.thru.includes("AM") || athlete.thru.includes("PM"));
  const pickCount = athlete.pickedBy.length;

  return (
    <View style={[styles.card, isCutOrWD && styles.cardDimmed]}>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => setExpanded((v) => !v)}
      >
        <View style={styles.posBlock}>
          <Text style={styles.pos}>{positionDisplay}</Text>
        </View>
        <View style={styles.nameBlock}>
          <Text style={styles.name} numberOfLines={1}>
            {athlete.full_name}
          </Text>
          <Text style={styles.pickCount}>
            {pickCount} {pickCount === 1 ? "pick" : "picks"}
          </Text>
        </View>
        <Text style={styles.score}>{scoreDisplay}</Text>
        <Text style={[styles.chevron, expanded && styles.chevronOpen]}>▾</Text>
      </Pressable>

      {expanded && (
        <View style={styles.body}>
          <View style={styles.statsRow}>
            <Stat label="Today" value={formatToPar(athlete.score_today)} />
            {athlete.thru !== null && (
              <Stat
                label={thruIsTeeTime ? "Tee Time" : "Thru"}
                value={athlete.thru}
              />
            )}
            <Stat label="R1" value={athlete.score_round_one} />
            <Stat label="R2" value={athlete.score_round_two} />
            <Stat label="R3" value={athlete.score_round_three} />
            <Stat label="R4" value={athlete.score_round_four} />
          </View>

          <Text style={styles.pickedByLabel}>Picked by</Text>
          {athlete.pickedBy.map((m) => {
            const posLabel = m.isDQ
              ? "DQ"
              : m.memberPosition != null
              ? `${m.isTied ? "T" : ""}${m.memberPosition}`
              : "—";
            const scoreLabel = m.isDQ
              ? "DQ"
              : formatToPar(m.memberScore) ?? "—";
            return (
              <View key={m.memberId} style={styles.pickedByRow}>
                <Text style={styles.pickedByPos}>{posLabel}</Text>
                <Text style={styles.pickedByName} numberOfLines={1}>
                  {m.displayName}
                </Text>
                {m.role === "COMMISSIONER" && (
                  <Text style={styles.commish}>C</Text>
                )}
                {m.memberScore !== null && (
                  <Text style={styles.pickedByScore}>{scoreLabel}</Text>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  const display =
    value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{display}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 6,
    overflow: "hidden",
  },
  cardDimmed: { opacity: 0.6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  rowPressed: { opacity: 0.6 },
  posBlock: { width: 50 },
  pos: { fontSize: 14, fontWeight: "700", color: Palette.gold },
  nameBlock: { flex: 1, minWidth: 0 },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  pickCount: {
    fontSize: 11,
    color: Colors.light.muted,
    marginTop: 2,
  },
  score: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
  },
  chevron: { color: Colors.light.muted, fontSize: 14, marginLeft: 4 },
  chevronOpen: { transform: [{ rotate: "180deg" }] },
  body: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    padding: 12,
    paddingTop: 10,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: Palette.grey[100],
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  stat: {
    flex: 1,
    minWidth: 56,
    alignItems: "center",
    paddingVertical: 2,
  },
  statLabel: { fontSize: 10, color: Colors.light.muted },
  statValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.text,
    marginTop: 1,
  },
  pickedByLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.muted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pickedByRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Palette.grey[100],
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
    gap: 10,
  },
  pickedByPos: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.gold,
    minWidth: 28,
  },
  pickedByName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: Colors.light.text,
  },
  commish: {
    fontSize: 10,
    fontWeight: "700",
    color: Palette.yellow,
    backgroundColor: `${Palette.gold}33`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pickedByScore: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.card,
    backgroundColor: Palette.green[700],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: "hidden",
  },
});
