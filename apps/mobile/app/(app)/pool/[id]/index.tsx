import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
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
  pivotToPlayerView,
  reformatPoolMembers,
  resolveTournamentStatus,
  type AthletePickFormatted,
  type PoolMemberFormatted,
  type PoolPhase,
} from "@pool-picks/utils";

import { PhaseBadge } from "@/components/phase-badge";
import { PlayerCard } from "@/components/player-card";
import { Spinner } from "@/components/spinner";
import { Colors, Palette } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

type PoolView = "members" | "players";

type StatusInfo = { text: string; tappable: boolean } | null;

function getStatusInfo(
  phase: PoolPhase,
  isCommissioner: boolean,
  isMember: boolean,
  hasPicks: boolean
): StatusInfo {
  switch (phase) {
    case "setup":
      if (isCommissioner) return null;
      return {
        text: "Commissioner is setting up the pool. Picks open once the field is finalized.",
        tappable: false,
      };
    case "open":
      if (!isMember || hasPicks) return null;
      return { text: "Field finalized. Make your picks.", tappable: true };
    case "locked-awaiting":
      return {
        text: "Picks are locked. Tournament hasn't started yet.",
        tappable: false,
      };
    case "live":
      return { text: "Tournament is underway.", tappable: false };
    case "completed":
      return {
        text: "Tournament complete. Final standings below.",
        tappable: false,
      };
  }
}

export default function PoolDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const poolId = Number(id);
  const router = useRouter();
  const { session } = useAuth();
  const [refreshingScores, setRefreshingScores] = useState(false);
  const [view, setView] = useState<PoolView>("members");

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

  const playerViewData = useMemo(
    () => pivotToPlayerView(formattedMembers),
    [formattedMembers]
  );

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
        <Spinner size={36} />
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
  const showViewToggle =
    phase === "locked-awaiting" ||
    phase === "live" ||
    phase === "completed";
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

      {isCommissioner && phase === "setup" && (
        <Pressable
          style={styles.commishCta}
          onPress={() =>
            router.push({
              pathname: "/(app)/pool/[id]/admin",
              params: { id: String(poolId) },
            })
          }
        >
          <View style={styles.commishCtaText}>
            <Text style={styles.commishCtaTitle}>Set up your pool</Text>
            <Text style={styles.commishCtaSubtitle}>
              Invite members and open picks when ready.
            </Text>
          </View>
          <Text style={styles.commishCtaChevron}>›</Text>
        </Pressable>
      )}

      {(() => {
        const info = getStatusInfo(
          phase,
          isCommissioner,
          !!currentUserMember,
          userHasPicks
        );
        if (!info) return null;
        const showRefresh =
          phase === "live" || phase === "locked-awaiting";
        const body = (
          <View style={styles.statusBody}>
            <Text style={styles.statusDesc}>{info.text}</Text>
            {showRefresh && (
              <Pressable
                style={[
                  styles.refreshBtn,
                  refreshingScores && styles.btnDisabled,
                ]}
                onPress={triggerRefreshScores}
                disabled={refreshingScores}
              >
                {refreshingScores ? (
                  <Spinner size={16} color={Colors.light.card} />
                ) : (
                  <Text style={styles.refreshBtnText}>Refresh scores</Text>
                )}
              </Pressable>
            )}
          </View>
        );
        if (info.tappable) {
          return (
            <Pressable
              style={styles.statusCard}
              onPress={() =>
                router.push({
                  pathname: "/(app)/pool/[id]/picks",
                  params: { id: String(poolId) },
                })
              }
            >
              {body}
              <Text style={styles.statusChevron}>›</Text>
            </Pressable>
          );
        }
        return <View style={styles.statusCard}>{body}</View>;
      })()}

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

      {isCommissioner && phase !== "setup" && (
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

      {showViewToggle && (
        <ViewToggle view={view} onChange={setView} />
      )}

      {view === "players" && showViewToggle ? (
        <View style={styles.leaderboard}>
          <Text style={styles.sectionHeading}>Players Picked</Text>
          {playerViewData.map((athlete) => (
            <PlayerCard key={athlete.id} athlete={athlete} />
          ))}
        </View>
      ) : showLeaderboard ? (
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
      ) : (
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

function ViewToggle({
  view,
  onChange,
}: {
  view: PoolView;
  onChange: (v: PoolView) => void;
}) {
  return (
    <View style={toggleStyles.container}>
      <Pressable
        onPress={() => onChange("members")}
        style={[toggleStyles.btn, view === "members" && toggleStyles.btnActive]}
      >
        <Text
          style={[
            toggleStyles.text,
            view === "members" && toggleStyles.textActive,
          ]}
        >
          Pool Members
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange("players")}
        style={[toggleStyles.btn, view === "players" && toggleStyles.btnActive]}
      >
        <Text
          style={[
            toggleStyles.text,
            view === "players" && toggleStyles.textActive,
          ]}
        >
          Players Picked
        </Text>
      </Pressable>
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignSelf: "flex-end",
    backgroundColor: Palette.grey[200],
    borderRadius: 999,
    padding: 2,
    marginTop: 12,
    marginBottom: 8,
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  btnActive: {
    backgroundColor: Colors.light.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.light.muted,
  },
  textActive: {
    color: Colors.light.text,
    fontWeight: "600",
  },
});

function LeaderboardRow({
  member,
  isCurrentUser,
}: {
  member: PoolMemberFormatted;
  isCurrentUser: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const position = member.member_position;
  const positionLabel =
    position == null
      ? "—"
      : `${member.isTied ? "T" : ""}${position}${ordinalSuffix(position)}`;

  const sortedPicks = useMemo(() => {
    return [...member.picks].sort((a, b) => {
      if (a.score_under_par !== null && b.score_under_par !== null) {
        return a.score_under_par - b.score_under_par;
      }
      if (a.score_under_par !== null) return -1;
      if (b.score_under_par !== null) return 1;
      return a.full_name.localeCompare(b.full_name);
    });
  }, [member.picks]);

  const hasPicks = sortedPicks.length > 0;

  return (
    <View style={[styles.lbCard, isCurrentUser && styles.lbCardCurrent]}>
      <Pressable
        style={({ pressed }) => [styles.lbRow, pressed && styles.lbRowPressed]}
        onPress={() => hasPicks && setExpanded((v) => !v)}
        disabled={!hasPicks}
      >
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
        {hasPicks && (
          <Text style={[styles.lbChevron, expanded && styles.lbChevronOpen]}>
            ▾
          </Text>
        )}
      </Pressable>
      {expanded &&
        sortedPicks.map((pick, index) => (
          <PickRow key={pick.id} pick={pick} index={index} />
        ))}
    </View>
  );
}

function PickRow({
  pick,
  index,
}: {
  pick: AthletePickFormatted;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const isCutOrWD = pick.status === "CUT" || pick.status === "WD";
  const positionDisplay = isCutOrWD
    ? pick.status
    : pick.position != null
    ? String(pick.position)
    : "—";
  const scoreDisplay = formatToPar(pick.score_under_par) ?? "—";
  const dimmed = index > 3 || pick.score_under_par === null;
  const thruIsTeeTime =
    pick.thru !== null &&
    (pick.thru.includes("AM") || pick.thru.includes("PM"));

  return (
    <View style={[styles.pickCard, dimmed && styles.pickCardDimmed]}>
      <Pressable
        style={({ pressed }) => [
          styles.pickHeaderRow,
          pressed && styles.pickHeaderPressed,
        ]}
        onPress={() => setOpen((v) => !v)}
      >
        <Text style={styles.pickName} numberOfLines={1}>
          {pick.full_name}
        </Text>
        <View style={styles.pickStatBlock}>
          <Text style={styles.pickStatLabel}>Pos</Text>
          <Text style={styles.pickStatValue}>{positionDisplay}</Text>
        </View>
        <View style={styles.pickStatBlock}>
          <Text style={styles.pickStatLabel}>Score</Text>
          <Text style={styles.pickStatValue}>{scoreDisplay}</Text>
        </View>
        <Text style={[styles.pickChevron, open && styles.pickChevronOpen]}>
          ▾
        </Text>
      </Pressable>
      {open && (
        <View style={styles.pickDetailRow}>
          <PickDetailStat label="Today" value={formatToPar(pick.score_today)} />
          {pick.thru !== null && (
            <PickDetailStat
              label={thruIsTeeTime ? "Tee Time" : "Thru"}
              value={pick.thru}
            />
          )}
          <PickDetailStat label="R1" value={pick.score_round_one} />
          <PickDetailStat label="R2" value={pick.score_round_two} />
          <PickDetailStat label="R3" value={pick.score_round_three} />
          <PickDetailStat label="R4" value={pick.score_round_four} />
        </View>
      )}
    </View>
  );
}

function PickDetailStat({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  const display =
    value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <View style={styles.detailStat}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{display}</Text>
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
    gap: 24,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  stat: {},
  statLabel: { fontSize: 11, color: Colors.light.muted },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
    marginTop: 2,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.tint,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    gap: 12,
  },
  statusBody: {
    flex: 1,
    gap: 10,
  },
  statusDesc: {
    color: Colors.light.text,
    fontSize: 13,
    lineHeight: 18,
  },
  statusChevron: {
    color: Colors.light.tint,
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 24,
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
  lbCard: {
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 6,
    overflow: "hidden",
  },
  lbCardCurrent: {
    borderColor: Palette.green[700],
    backgroundColor: Palette.green[50],
  },
  lbRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  lbRowPressed: { opacity: 0.6 },
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
  lbChevron: { color: Colors.light.muted, fontSize: 14, marginLeft: 4 },
  lbChevronOpen: { transform: [{ rotate: "180deg" }] },
  pickCard: {
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  pickCardDimmed: { opacity: 0.6 },
  pickHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  pickHeaderPressed: { opacity: 0.6 },
  pickName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.text,
  },
  pickStatBlock: {
    alignItems: "center",
    minWidth: 44,
  },
  pickStatLabel: { fontSize: 10, color: Colors.light.muted },
  pickStatValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
    marginTop: 1,
  },
  pickChevron: { color: Colors.light.muted, fontSize: 12, marginLeft: 4 },
  pickChevronOpen: { transform: [{ rotate: "180deg" }] },
  pickDetailRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: Palette.grey[100],
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  detailStat: {
    flex: 1,
    minWidth: 60,
    alignItems: "center",
    paddingVertical: 4,
  },
  detailLabel: { fontSize: 10, color: Colors.light.muted },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.text,
    marginTop: 1,
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
  commishCta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Palette.green[700],
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  commishCtaText: { flex: 1 },
  commishCtaTitle: {
    color: Colors.light.card,
    fontSize: 16,
    fontWeight: "700",
  },
  commishCtaSubtitle: {
    color: `${Colors.light.card}cc`,
    fontSize: 12,
    marginTop: 2,
  },
  commishCtaChevron: {
    color: Colors.light.card,
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 24,
  },
});
