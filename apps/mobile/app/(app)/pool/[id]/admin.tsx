import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { POOL_STATUSES, type PoolStatus } from "@pool-picks/utils";

import { Colors, Palette } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

const STATUS_DESCRIPTIONS: Record<PoolStatus, string> = {
  Setup: "Invite members. Picks aren't open yet.",
  Open: "Field is finalized. Members can submit picks.",
  Locked: "Picks are final. Awaiting tournament start.",
  Complete: "Tournament finished, results visible.",
};

export default function CommissionerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const poolId = Number(id);

  const poolQuery = trpc.pool.getById.useQuery({ id: poolId });
  const utils = trpc.useUtils();

  const [pendingStatus, setPendingStatus] = useState<PoolStatus | null>(null);
  const [confirmingNotify, setConfirmingNotify] = useState(false);

  const updateStatus = trpc.pool.updateStatus.useMutation({
    onSuccess: async () => {
      await utils.pool.getById.invalidate({ id: poolId });
      setPendingStatus(null);
      setConfirmingNotify(false);
    },
    onError: (err) => {
      Alert.alert("Couldn't update status", err.message);
      setPendingStatus(null);
      setConfirmingNotify(false);
    },
  });

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNickname, setInviteNickname] = useState("");

  const createInvite = trpc.poolInvite.create.useMutation({
    onSuccess: async () => {
      await utils.pool.getById.invalidate({ id: poolId });
      setInviteEmail("");
      setInviteNickname("");
    },
    onError: (err) => Alert.alert("Couldn't send invite", err.message),
  });

  if (poolQuery.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.light.tint} />
      </View>
    );
  }

  if (poolQuery.isError || !poolQuery.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Couldn't load pool</Text>
      </View>
    );
  }

  const pool = poolQuery.data;
  const currentStatus = pool.status as PoolStatus;
  const pendingInvites = pool.pool_invites;

  function chooseStatus(status: PoolStatus) {
    if (status === currentStatus) return;
    if (status === "Open" || status === "Locked") {
      setPendingStatus(status);
      return;
    }
    updateStatus.mutate({ pool_id: poolId, status, notify: false });
  }

  function confirmStatusUpdate(notify: boolean) {
    if (!pendingStatus) return;
    setConfirmingNotify(notify);
    updateStatus.mutate({ pool_id: poolId, status: pendingStatus, notify });
  }

  function submitInvite() {
    const email = inviteEmail.trim().toLowerCase();
    const nickname = inviteNickname.trim();
    if (!email || !nickname) {
      Alert.alert("Missing info", "Enter both an email and a nickname.");
      return;
    }
    createInvite.mutate({
      pool_id: poolId,
      email,
      nickname,
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.poolName}>{pool.name}</Text>
        <Text style={styles.tournamentName}>{pool.tournament.name}</Text>

        <Text style={styles.sectionHeading}>Pool status</Text>
        <View style={styles.statusList}>
          {POOL_STATUSES.map((status) => {
            const isCurrent = status === currentStatus;
            return (
              <Pressable
                key={status}
                style={[
                  styles.statusOption,
                  isCurrent && styles.statusOptionActive,
                ]}
                onPress={() => chooseStatus(status)}
                disabled={updateStatus.isPending}
              >
                <View style={styles.statusTextBlock}>
                  <Text
                    style={[
                      styles.statusName,
                      isCurrent && styles.statusNameActive,
                    ]}
                  >
                    {status}
                  </Text>
                  <Text style={styles.statusDesc}>
                    {STATUS_DESCRIPTIONS[status]}
                  </Text>
                </View>
                {isCurrent && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>
            );
          })}
        </View>

        {currentStatus === "Setup" && (
          <>
            <Text style={styles.sectionHeading}>Invite a member</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email address"
              placeholderTextColor={Colors.light.muted}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              editable={!createInvite.isPending}
            />
            <TextInput
              style={[styles.input, styles.inputSpaced]}
              placeholder="Nickname"
              placeholderTextColor={Colors.light.muted}
              value={inviteNickname}
              onChangeText={setInviteNickname}
              autoCapitalize="words"
              maxLength={30}
              editable={!createInvite.isPending}
            />
            <Pressable
              style={[
                styles.primaryBtn,
                createInvite.isPending && styles.btnDimmed,
              ]}
              onPress={submitInvite}
              disabled={createInvite.isPending}
            >
              {createInvite.isPending ? (
                <ActivityIndicator color={Colors.light.card} />
              ) : (
                <Text style={styles.primaryBtnText}>Send invite</Text>
              )}
            </Pressable>
          </>
        )}

        {pendingInvites.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>
              Pending invites ({pendingInvites.length})
            </Text>
            {pendingInvites.map((invite) => (
              <View key={invite.id} style={styles.inviteRow}>
                <View style={styles.inviteLeft}>
                  <Text style={styles.inviteEmail} numberOfLines={1}>
                    {invite.email}
                  </Text>
                  <Text style={styles.inviteNickname}>
                    nickname: {invite.nickname}
                  </Text>
                </View>
                <View style={styles.invitePill}>
                  <Text style={styles.invitePillText}>{invite.status}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <Pressable
          style={styles.cancelBtn}
          onPress={() => router.back()}
          disabled={updateStatus.isPending || createInvite.isPending}
        >
          <Text style={styles.cancelText}>Done</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={pendingStatus !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingStatus(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {pendingStatus === "Open"
                ? "Open this pool?"
                : pendingStatus === "Locked"
                ? "Lock this pool?"
                : ""}
            </Text>
            <Text style={styles.modalBody}>
              {pendingStatus === "Open"
                ? "Members can start picking. You can also notify pending invitees by email."
                : "Picks become final. Members can see who picked what. Optionally notify everyone."}
            </Text>
            <Pressable
              style={[styles.primaryBtn, styles.modalBtn]}
              onPress={() => confirmStatusUpdate(true)}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending && confirmingNotify ? (
                <ActivityIndicator color={Colors.light.card} />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {pendingStatus === "Open" ? "Open & notify" : "Lock & notify"}
                </Text>
              )}
            </Pressable>
            <Pressable
              style={[styles.secondaryBtn, styles.modalBtn]}
              onPress={() => confirmStatusUpdate(false)}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending && !confirmingNotify ? (
                <ActivityIndicator color={Colors.light.text} />
              ) : (
                <Text style={styles.secondaryBtnText}>
                  {pendingStatus === "Open"
                    ? "Open without notifying"
                    : "Lock without notifying"}
                </Text>
              )}
            </Pressable>
            <Pressable
              style={styles.modalCancel}
              onPress={() => setPendingStatus(null)}
              disabled={updateStatus.isPending}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.light.background },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.background,
  },
  errorTitle: { color: Colors.light.text, fontSize: 16, fontWeight: "600" },
  content: { padding: 16, paddingBottom: 48 },
  poolName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  tournamentName: {
    fontSize: 13,
    color: Colors.light.muted,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 10,
  },
  statusList: { gap: 6 },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
  },
  statusOptionActive: {
    borderColor: Palette.green[700],
    backgroundColor: Palette.green[50],
  },
  statusTextBlock: { flex: 1 },
  statusName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
  },
  statusNameActive: { color: Palette.green[700] },
  statusDesc: { fontSize: 12, color: Colors.light.muted, marginTop: 2 },
  checkmark: { color: Palette.green[700], fontSize: 18, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    color: Colors.light.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputSpaced: { marginTop: 10 },
  primaryBtn: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  primaryBtnText: { color: Colors.light.card, fontWeight: "700", fontSize: 15 },
  secondaryBtn: {
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryBtnText: { color: Colors.light.text, fontWeight: "600", fontSize: 14 },
  btnDimmed: { opacity: 0.6 },
  inviteRow: {
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
  inviteLeft: { flex: 1, minWidth: 0 },
  inviteEmail: { fontSize: 14, color: Colors.light.text, fontWeight: "500" },
  inviteNickname: { fontSize: 12, color: Colors.light.muted, marginTop: 2 },
  invitePill: {
    backgroundColor: `${Palette.gold}33`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  invitePillText: { fontSize: 11, color: Palette.yellow, fontWeight: "600" },
  cancelBtn: {
    marginTop: 24,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  cancelText: { color: Colors.light.muted, fontSize: 14, fontWeight: "500" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 20,
    width: "100%",
    maxWidth: 360,
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  modalBody: {
    fontSize: 13,
    color: Colors.light.muted,
    marginBottom: 8,
  },
  modalBtn: { marginTop: 0 },
  modalCancel: { paddingVertical: 10, alignItems: "center", marginTop: 4 },
  modalCancelText: { color: Colors.light.muted, fontSize: 14, fontWeight: "500" },
});
