import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  formatToPar,
  formatTournamentDates,
  getEffectivePoolPhase,
  ordinalSuffix,
  PICKS_PER_MEMBER,
  reformatPoolMembers,
  resolveTournamentStatus,
  type PoolMemberFormatted,
  type PoolPhase,
} from "@pool-picks/utils";

import { PhaseBadge } from "@/components/phase-badge";
import { Colors, Palette } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

function getPhaseDescription(phase: PoolPhase, isCommissioner: boolean): string {
  switch (phase) {
    case "setup":
      return isCommissioner
        ? "Invite members, then open the pool to collect picks."
        : "Commissioner is still setting up. Invite members before opening.";
    case "open":
      return "Picks are open. Choose 6 athletes before the tournament starts.";
    case "locked-awaiting":
      return "Picks are locked. Tournament hasn't started yet.";
    case "live":
      return "Tournament is underway. Pull down to refresh live scores.";
    case "completed":
      return "Tournament complete. Final standings below.";
  }
}

export default function PoolDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const poolId = Number(id);
  const router = useRouter();
  const { session } = useAuth();
  const [refreshingScores, setRefreshingScores] = useState(false);

  const poolQuery = trpc.pool.getById.useQuery({ id: poolId }, {
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      const phase = getEffectivePoolPhase(
        data.status,
        resolveTournamentStatus(data.tournament)
      );
      return phase === "live" ? 30_000 : false;
    },
  });

  const onRefresh = useCallback(async () => {
    await poolQuery.refetch();
  }, [poolQuery]);

  const phase: PoolPhase | null = useMemo(() => {
    if (!poolQuery.data) return null;
    return getEffectivePoolPhase(
      poolQuery.data.status,
      resolveTournamentStatus(poolQuery.data.tournament)
    );
  }, [poolQuery.data]);

  const formattedMembers: PoolMemberFormatted[] = useMemo(() => {
    if (!poolQuery.data) return [];
    return reformatPoolMembers(
      poolQuery.data.pool_members,
      poolQuery.data.tournament_id
    );
  }, [poolQuery.data]);

  const currentUserMember = poolQuery.data?.pool_members.find(
    (m) => m.user.email === session?.user.email
  );
  const isCommissioner =
    poolQuery.data?.pool_members.some(
      (m) => m.user_id === session?.user.id && m.role === "COMMISSIONER"
    ) ?? false;

  if (poolQuery.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.light.tint} />
      </View>
    );
  }

  if (poolQuery.isError || !poolQuery.data || !phase) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Couldn't load pool</Text>
        <Text style={styles.errorBody}>
          {poolQuery.error?.message ?? "Pool not found."}
        </Text>
        <Pressable style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const pool = poolQuery.data;
  const showLeaderboard = phase === "live" || phase === "completed";
  const totalPot = pool.amount_entry * pool.pool_members.length;
  const userHasPicks =
    currentUserMember?.athletes.length === PICKS_PER_MEMBER;

  async function triggerRefreshScores() {
    setRefreshingScores(true);
    try {
      await poolQuery.refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      Alert.alert("Couldn't refresh scores", message);
    } finally {
      setRefreshingScores(false);
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={poolQuery.isFetching && !refreshingScores}
          onRefresh={onRefresh}
          tintColor={Colors.light.tint}
        />
      }
    >
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <Text style={styles.poolName}>{pool.name}</Text>
          <PhaseBadge phase={phase} />
        </View>
        <Text style={styles.tournamentName}>{pool.tournament.name}</Text>
        {pool.tournament.course && (
          <Text style={styles.tournamentCourse}>{pool.tournament.course}</Text>
        )}
        <Text style={styles.tournamentDates}>
          {formatTournamentDates(
            pool.tournament.start_date,
            pool.tournament.end_date
          )}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Members</Text>
            <Text style={styles.statValue}>{pool.pool_members.length}</Text>
          </View>
          {pool.amount_entry > 0 && (
            <>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Entry</Text>
                <Text style={styles.statValue}>${pool.amount_entry}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Pot</Text>
                <Text style={styles.statValue}>${totalPot}</Text>
              </View>
            </>
          )}
        </View>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusDesc}>
          {getPhaseDescription(phase, isCommissioner)}
        </Text>
        {(phase === "live" || phase === "locked-awaiting") && (
          <Pressable
            style={[styles.refreshBtn, refreshingScores && styles.btnDisabled]}
            onPress={triggerRefreshScores}
            disabled={refreshingScores}
          >
            {refreshingScores ? (
              <ActivityIndicator size="small" color={Colors.light.card} />
            ) : (
              <Text style={styles.refreshBtnText}>Refresh scores</Text>
            )}
          </Pressable>
        )}
      </View>

      {phase === "open" && currentUserMember && !userHasPicks && (
        <Pressable
          style={styles.ctaBtn}
          onPress={() =>
            router.push({
              pathname: "/(app)/pool/[id]/picks",
              params: { id: String(poolId) },
            })
          }
        >
          <Text style={styles.ctaText}>Make your picks</Text>
          <Text style={styles.ctaSubtext}>Pick 6 athletes to compete</Text>
        </Pressable>
      )}

      {phase === "open" && currentUserMember && userHasPicks && (
        <View style={styles.successPill}>
          <Text style={styles.successText}>
            Your picks are in. Edit anytime before the pool locks.
          </Text>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/(app)/pool/[id]/picks",
                params: { id: String(poolId) },
              })
            }
          >
            <Text style={styles.successLink}>Edit picks</Text>
          </Pressable>
        </View>
      )}

      {isCommissioner && (
        <Pressable
          style={styles.adminLinkBtn}
          onPress={() =>
            router.push({
              pathname: "/(app)/pool/[id]/admin",
              params: { id: String(poolId) },
            })
          }
        >
          <Text style={styles.adminLinkText}>Commissioner panel</Text>
        </Pressable>
      )}

      {showLeaderboard && (
        <View style={styles.leaderboard}>
          <Text style={styles.sectionHeading}>Leaderboard</Text>
          {formattedMembers
            .slice()
            .sort((a, b) => {
              if (a.member_position == null) return 1;
              if (b.member_position == null) return -1;
              return a.member_position - b.member_position;
            })
            .map((member) => (
              <LeaderboardRow
                key={member.id}
                member={member}
                isCurrentUser={member.id === currentUserMember?.id}
              />
            ))}
        </View>
      )}

      {!showLeaderboard && (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Members</Text>
          {pool.pool_members.map((m) => (
            <View key={m.id} style={styles.memberRow}>
              <Text style={styles.memberName}>
                {m.username || m.user.nickname || m.user.email}
              </Text>
              {phase === "open" && (
                <Text
                  style={[
                    styles.memberStatus,
                    m.athletes.length === PICKS_PER_MEMBER
                      ? styles.memberStatusReady
                      : styles.memberStatusPending,
                  ]}
                >
                  {m.athletes.length === PICKS_PER_MEMBER
                    ? "Picks in"
                    : "Awaiting picks"}
                </Text>
              )}
              {m.role === "COMMISSIONER" && (
                <Text style={styles.commishLabel}>Commish</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function LeaderboardRow({
  member,
  isCurrentUser,
}: {
  member: PoolMemberFormatted;
  isCurrentUser: boolean;
}) {
  const position = member.member_position;
  const positionLabel =
    position == null
      ? "—"
      : `${member.isTied ? "T" : ""}${position}${ordinalSuffix(position)}`;

  return (
    <View style={[styles.lbRow, isCurrentUser && styles.lbRowCurrent]}>
      <View style={styles.lbPosBlock}>
        <Text style={styles.lbPos}>{positionLabel}</Text>
      </View>
      <View style={styles.lbNameBlock}>
        <Text
          style={[styles.lbName, isCurrentUser && styles.lbNameCurrent]}
          numberOfLines={1}
        >
          {member.username || member.nickname || "—"}
        </Text>
        {member.role === "COMMISSIONER" && (
          <Text style={styles.lbCommish}>Commish</Text>
        )}
      </View>
      <Text style={styles.lbScore}>
        {formatToPar(member.member_sum_under_par) ?? "—"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: 16, paddingBottom: 64 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.background,
    padding: 24,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
  },
  errorBody: {
    fontSize: 13,
    color: Colors.light.muted,
    textAlign: "center",
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.tint,
  },
  retryText: { color: Colors.light.card, fontWeight: "600" },
  headerCard: {
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  poolName: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
    flex: 1,
  },
  tournamentName: {
    fontSize: 15,
    color: Colors.light.text,
    marginTop: 6,
  },
  tournamentCourse: {
    fontSize: 13,
    color: Colors.light.muted,
    marginTop: 2,
  },
  tournamentDates: {
    fontSize: 13,
    color: Colors.light.muted,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  stat: { alignItems: "center" },
  statLabel: { fontSize: 11, color: Colors.light.muted },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
    marginTop: 2,
  },
  statusCard: {
    backgroundColor: Palette.green[50],
    borderColor: Palette.green[100],
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  statusDesc: {
    color: Palette.green[700],
    fontSize: 13,
    lineHeight: 18,
  },
  refreshBtn: {
    alignSelf: "flex-start",
    backgroundColor: Palette.green[700],
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  refreshBtnText: { color: Colors.light.card, fontSize: 13, fontWeight: "600" },
  btnDisabled: { opacity: 0.6 },
  ctaBtn: {
    backgroundColor: Palette.green[700],
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  ctaText: { color: Colors.light.card, fontSize: 16, fontWeight: "700" },
  ctaSubtext: {
    color: `${Colors.light.card}cc`,
    fontSize: 12,
    marginTop: 2,
  },
  successPill: {
    backgroundColor: Palette.green[100],
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  successText: {
    color: Palette.green[700],
    fontSize: 12,
    flexShrink: 1,
  },
  successLink: {
    color: Palette.green[700],
    fontSize: 12,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  leaderboard: { marginTop: 4 },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 8,
    marginTop: 4,
  },
  lbRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    gap: 12,
  },
  lbRowCurrent: {
    borderColor: Palette.green[700],
    backgroundColor: Palette.green[50],
  },
  lbPosBlock: { width: 50 },
  lbPos: { fontSize: 14, fontWeight: "700", color: Colors.light.tint },
  lbNameBlock: { flex: 1, minWidth: 0 },
  lbName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  lbNameCurrent: { color: Palette.green[700] },
  lbCommish: {
    fontSize: 10,
    color: Palette.yellow,
    fontWeight: "600",
    marginTop: 1,
  },
  lbScore: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
  },
  section: { marginTop: 4 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    gap: 8,
  },
  memberName: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: "500",
  },
  memberStatus: { fontSize: 11, fontWeight: "600" },
  memberStatusReady: { color: Palette.green[700] },
  memberStatusPending: { color: Palette.yellow },
  commishLabel: {
    fontSize: 10,
    color: Palette.yellow,
    fontWeight: "700",
    backgroundColor: `${Palette.gold}33`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminLinkBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
  },
  adminLinkText: {
    color: Colors.light.tint,
    fontWeight: "600",
    fontSize: 14,
  },
});
