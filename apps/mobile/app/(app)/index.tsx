import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
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
  getEffectivePoolPhase,
  resolveTournamentStatus,
  type PoolPhase,
} from "@pool-picks/utils";

import {
  PendingInviteCard,
  type PendingInvite,
} from "@/components/pending-invite-card";
import { PoolCard, type PoolCardData } from "@/components/pool-card";
import { Spinner } from "@/components/spinner";
import { Colors, Palette } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

const PHASE_GROUP_ORDER: PoolPhase[] = [
  "live",
  "open",
  "locked-awaiting",
  "setup",
];

function getPhaseFor(member: PoolCardData): PoolPhase {
  return getEffectivePoolPhase(
    member.pool.status,
    resolveTournamentStatus(member.pool.tournament)
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { signOut, session } = useAuth();
  const [busyInviteId, setBusyInviteId] = useState<{
    id: number;
    action: "accept" | "decline";
  } | null>(null);
  const [completedOpen, setCompletedOpen] = useState(false);

  const invitesQuery = trpc.poolInvite.listPending.useQuery();
  const poolsQuery = trpc.poolMember.listByUser.useQuery();
  const utils = trpc.useUtils();

  const updateInvite = trpc.poolInvite.updateStatus.useMutation({
    onSuccess: async (_, variables) => {
      await utils.poolInvite.listPending.invalidate();
      await utils.poolMember.listByUser.invalidate();
      setBusyInviteId(null);
      if (variables.status === "Accepted") {
        router.push(`/(app)/pool/${variables.pool_id}`);
      }
    },
    onError: (err) => {
      setBusyInviteId(null);
      Alert.alert("Couldn't update invite", err.message);
    },
  });

  const onRefresh = useCallback(async () => {
    await Promise.all([invitesQuery.refetch(), poolsQuery.refetch()]);
  }, [invitesQuery, poolsQuery]);

  const refreshing =
    invitesQuery.isFetching || poolsQuery.isFetching;

  function handleInvite(
    invite: PendingInvite,
    action: "accept" | "decline"
  ) {
    if (!session?.user.email) return;
    setBusyInviteId({ id: invite.id, action });
    updateInvite.mutate({
      id: invite.id,
      status: action === "accept" ? "Accepted" : "Rejected",
      pool_id: invite.pool.id,
      nickname: invite.nickname,
      email: session.user.email,
    });
  }

  if (invitesQuery.isPending || poolsQuery.isPending) {
    return (
      <View style={styles.center}>
        <Spinner size={36} />
      </View>
    );
  }

  if (invitesQuery.isError || poolsQuery.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Couldn't load your pools</Text>
        <Text style={styles.errorBody}>
          {invitesQuery.error?.message || poolsQuery.error?.message}
        </Text>
        <Pressable style={styles.retryBtn} onPress={onRefresh}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
        <Pressable style={styles.signOutBtn} onPress={signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
    );
  }

  const invites = invitesQuery.data ?? [];
  const pools = (poolsQuery.data ?? []) as PoolCardData[];

  const grouped: Record<string, PoolCardData[]> = {};
  for (const m of pools) {
    const phase = getPhaseFor(m);
    if (!grouped[phase]) grouped[phase] = [];
    grouped[phase].push(m);
  }
  const completed = grouped["completed"] ?? [];
  const hasActive = PHASE_GROUP_ORDER.some((p) => grouped[p]?.length);
  const isEmpty =
    invites.length === 0 && !hasActive && completed.length === 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.light.tint}
        />
      }
    >
      {invites.map((invite) => (
        <PendingInviteCard
          key={invite.id}
          invite={invite}
          busyAction={
            busyInviteId?.id === invite.id ? busyInviteId.action : null
          }
          onAccept={() => handleInvite(invite, "accept")}
          onDecline={() => handleInvite(invite, "decline")}
        />
      ))}

      {isEmpty && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            You're not in any active pools yet. Create one or wait for an invite.
          </Text>
          <Pressable
            style={styles.emptyBtn}
            onPress={() => router.push("/(app)/pool/create")}
          >
            <Text style={styles.emptyBtnText}>Create a pool</Text>
          </Pressable>
        </View>
      )}

      {PHASE_GROUP_ORDER.map((phase) => {
        const list = grouped[phase];
        if (!list?.length) return null;
        return (
          <View key={phase} style={styles.section}>
            {list.map((member) => (
              <PoolCard key={member.id} member={member} />
            ))}
          </View>
        );
      })}

      {completed.length > 0 && (
        <View style={styles.section}>
          <Pressable
            style={styles.completedToggle}
            onPress={() => setCompletedOpen((v) => !v)}
          >
            <Text style={styles.completedToggleText}>
              Complete ({completed.length})
            </Text>
            <Text style={styles.chevron}>{completedOpen ? "▾" : "▸"}</Text>
          </Pressable>
          {completedOpen &&
            completed.map((member) => (
              <PoolCard key={member.id} member={member} />
            ))}
        </View>
      )}

      <Pressable style={styles.signOutBtn} onPress={signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: 16, paddingBottom: 48 },
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
  section: { marginTop: 4 },
  empty: {
    backgroundColor: Palette.green[50],
    borderColor: Palette.green[100],
    borderWidth: 1,
    borderRadius: 10,
    padding: 18,
    alignItems: "center",
  },
  emptyText: {
    color: Palette.green[700],
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  emptyBtn: {
    backgroundColor: Palette.green[700],
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyBtnText: { color: Colors.light.card, fontWeight: "600" },
  completedToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Palette.grey[200],
    borderColor: Palette.grey[100],
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  completedToggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.muted,
  },
  chevron: { color: Colors.light.muted, fontSize: 14 },
  signOutBtn: {
    marginTop: 24,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  signOutText: { color: Colors.light.muted, fontSize: 13, fontWeight: "500" },
});
