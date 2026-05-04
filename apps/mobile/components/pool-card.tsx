import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  formatToPar,
  formatTournamentDates,
  getEffectivePoolPhase,
  ordinalSuffix,
  PICKS_PER_MEMBER,
  resolveTournamentStatus,
  type PoolPhase,
} from "@pool-picks/utils";

import { Colors, Palette } from "@/constants/theme";
import { PhaseBadge } from "./phase-badge";

export type PoolCardData = {
  id: number;
  role: string;
  rank: number | null;
  score: number | null;
  isTied: boolean;
  picksCount: number;
  memberCount: number;
  pool: {
    id: number;
    name: string;
    status: string;
    amount_entry: number;
    tournament: {
      name: string;
      start_date: Date;
      end_date: Date;
      status: string;
    };
  };
};

function getPhase(member: PoolCardData): PoolPhase {
  const tournamentStatus = resolveTournamentStatus(member.pool.tournament);
  return getEffectivePoolPhase(member.pool.status, tournamentStatus);
}

export function PoolCard({ member }: { member: PoolCardData }) {
  const router = useRouter();
  const phase = getPhase(member);
  const showScore = phase === "live" || phase === "completed";
  const hasPicks = member.picksCount === PICKS_PER_MEMBER;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push(`/(app)/pool/${member.pool.id}`)}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.poolName} numberOfLines={1}>
              {member.pool.name}
            </Text>
            {member.role === "COMMISSIONER" && (
              <View style={styles.commishPill}>
                <Text style={styles.commishText}>C</Text>
              </View>
            )}
          </View>
          <Text style={styles.tournament} numberOfLines={1}>
            {member.pool.tournament.name}
          </Text>
        </View>
        <PhaseBadge phase={phase} />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {formatTournamentDates(
            member.pool.tournament.start_date,
            member.pool.tournament.end_date
          )}
        </Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaText}>{member.memberCount} members</Text>
        {member.pool.amount_entry > 0 && (
          <>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>${member.pool.amount_entry} entry</Text>
          </>
        )}
      </View>

      {showScore && member.rank !== null && (
        <View style={styles.scoreRow}>
          <View>
            <Text style={styles.scoreLabel}>Rank</Text>
            <Text style={styles.scoreValue}>
              {member.isTied ? "T" : ""}
              {member.rank}
              <Text style={styles.scoreOrdinal}>{ordinalSuffix(member.rank)}</Text>
            </Text>
          </View>
          <View>
            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={styles.scoreValue}>
              {formatToPar(member.score) ?? "—"}
            </Text>
          </View>
        </View>
      )}

      {phase === "open" && (
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: hasPicks
                  ? Palette.green[100]
                  : `${Palette.gold}33`,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: hasPicks ? Palette.green[700] : Palette.yellow },
              ]}
            >
              {hasPicks ? "Picks submitted" : "Picks needed"}
            </Text>
          </View>
        </View>
      )}

      {phase === "locked-awaiting" && (
        <View style={styles.statusRow}>
          <Text style={styles.lockedNote}>
            Picks locked — waiting for tournament to start
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  pressed: { opacity: 0.7 },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  titleBlock: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  poolName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
    flexShrink: 1,
  },
  commishPill: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: `${Palette.gold}33`,
    alignItems: "center",
    justifyContent: "center",
  },
  commishText: { fontSize: 10, fontWeight: "700", color: Palette.yellow },
  tournament: {
    fontSize: 13,
    color: Colors.light.muted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 10,
  },
  metaText: { fontSize: 12, color: Colors.light.muted },
  metaDot: { fontSize: 12, color: Colors.light.muted },
  scoreRow: {
    flexDirection: "row",
    gap: 24,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  scoreLabel: { fontSize: 11, color: Colors.light.muted },
  scoreValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.tint,
    marginTop: 2,
  },
  scoreOrdinal: { fontSize: 12, fontWeight: "600" },
  statusRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  statusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: { fontSize: 11, fontWeight: "600" },
  lockedNote: { fontSize: 12, color: Colors.light.muted },
});
