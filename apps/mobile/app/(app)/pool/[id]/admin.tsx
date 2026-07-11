import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { POOL_STATUSES, type PoolStatus } from "@pool-picks/utils";

type JoinMode = "OPEN" | "INVITE_ONLY";

import { Spinner } from "@/components/spinner";
import { Colors, Palette } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

// Derive the public app base URL from EXPO_PUBLIC_TRPC_URL. In dev this
// points at the LAN/ngrok web server, in prod at https://poolpicks.app.
// Mirrors what web does with window.location.origin.
const APP_BASE_URL = (process.env.EXPO_PUBLIC_TRPC_URL ?? "").replace(
  /\/api\/trpc\/?$/,
  ""
);

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
  const [updatingStatus, setUpdatingStatus] = useState<PoolStatus | null>(null);
  const [confirmingNotify, setConfirmingNotify] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const updateStatus = trpc.pool.updateStatus.useMutation({
    onSuccess: async () => {
      await utils.pool.getById.invalidate({ id: poolId });
      setPendingStatus(null);
      setUpdatingStatus(null);
      setConfirmingNotify(false);
    },
    onError: (err) => {
      Alert.alert("Couldn't update status", err.message);
      setPendingStatus(null);
      setUpdatingStatus(null);
      setConfirmingNotify(false);
    },
  });

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNickname, setInviteNickname] = useState("");
  const [optimisticJoinMode, setOptimisticJoinMode] = useState<JoinMode | null>(
    null
  );

  const createInvite = trpc.poolInvite.create.useMutation({
    onSuccess: async () => {
      await utils.pool.getById.invalidate({ id: poolId });
      setInviteEmail("");
      setInviteNickname("");
    },
    onError: (err) => Alert.alert("Couldn't send invite", err.message),
  });

  const updateJoinMode = trpc.pool.updateJoinMode.useMutation({
    onSuccess: async () => {
      await utils.pool.getById.invalidate({ id: poolId });
      setOptimisticJoinMode(null);
    },
    onError: (err) => {
      Alert.alert("Couldn't update join mode", err.message);
      setOptimisticJoinMode(null);
    },
  });

  if (poolQuery.isPending) {
    return (
      <View style={styles.center}>
        <Spinner size={36} />
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
    setUpdatingStatus(status);
    updateStatus.mutate({ pool_id: poolId, status, notify: false });
  }

  function confirmStatusUpdate(notify: boolean) {
    if (!pendingStatus) return;
    setConfirmingNotify(notify);
    setUpdatingStatus(pendingStatus);
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

  const inviteUrl =
    pool.invite_code && APP_BASE_URL
      ? `${APP_BASE_URL}/join/${pool.invite_code}`
      : null;

  const effectiveJoinMode: JoinMode =
    optimisticJoinMode ?? (pool.join_mode as JoinMode);

  function chooseJoinMode(next: JoinMode) {
    if (next === effectiveJoinMode) return;
    setOptimisticJoinMode(next);
    updateJoinMode.mutate({ pool_id: poolId, join_mode: next });
  }

  async function shareInviteLink() {
    if (!inviteUrl) return;
    try {
      await Share.share({
        message: `Join my PoolPicks pool: ${inviteUrl}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      Alert.alert("Couldn't share", message);
    }
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

        <Pressable
          style={styles.helpToggle}
          onPress={() => setHelpOpen((v) => !v)}
        >
          <Text style={styles.helpToggleText}>What being commissioner means</Text>
          <Text style={[styles.helpChevron, helpOpen && styles.helpChevronOpen]}>
            ▾
          </Text>
        </Pressable>
        {helpOpen && (
          <View style={styles.helpBody}>
            <HelpBullet
              title="You decide when picks open."
              body="Open the pool once the field is finalized."
            />
            <HelpBullet
              title="You can invite members anytime up to lock."
              body="Members can keep joining after picks are open."
            />
            <HelpBullet
              title="The pool auto-locks at midnight Pacific"
              body="the day the tournament starts. You can lock earlier if you want."
            />
            <HelpBullet
              title="Pool auto-completes"
              body="a week after the tournament finishes. You can mark it complete sooner."
            />
            <HelpBullet
              title="Payments are on you."
              body="Pool Picks tracks scores and standings — collecting entry fees and paying out the winner happens outside the app."
            />
          </View>
        )}

        <Text style={styles.sectionHeading}>Pool status</Text>
        <View style={styles.statusList}>
          {POOL_STATUSES.map((status) => {
            const isCurrent = status === currentStatus;
            const isUpdatingThis =
              updateStatus.isPending && updatingStatus === status;
            return (
              <Pressable
                key={status}
                style={({ pressed }) => [
                  styles.statusOption,
                  isCurrent && styles.statusOptionActive,
                  pressed && styles.statusOptionPressed,
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
                {isUpdatingThis ? (
                  <Spinner size={18} color={Palette.green[700]} />
                ) : isCurrent ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {(currentStatus === "Setup" || currentStatus === "Open") && (
          <>
            <Text style={styles.sectionHeading}>Pool access</Text>
            <View style={styles.radioList}>
              <RadioOption
                selected={effectiveJoinMode === "OPEN"}
                onPress={() => chooseJoinMode("OPEN")}
                label="Anyone with the invite link"
              />
              <RadioOption
                selected={effectiveJoinMode === "INVITE_ONLY"}
                onPress={() => chooseJoinMode("INVITE_ONLY")}
                label="Only people I invite by email"
              />
            </View>

            {effectiveJoinMode === "INVITE_ONLY" ? (
              <>
                <EmailInviteBlock
                  inviteEmail={inviteEmail}
                  setInviteEmail={setInviteEmail}
                  inviteNickname={inviteNickname}
                  setInviteNickname={setInviteNickname}
                  submitInvite={submitInvite}
                  createInvitePending={createInvite.isPending}
                />
                {inviteUrl && (
                  <InviteLinkBlock
                    code={pool.invite_code!}
                    inviteUrl={inviteUrl}
                    onShare={shareInviteLink}
                    showInviteOnlyNote
                  />
                )}
              </>
            ) : (
              <>
                {inviteUrl && (
                  <InviteLinkBlock
                    code={pool.invite_code!}
                    inviteUrl={inviteUrl}
                    onShare={shareInviteLink}
                    showInviteOnlyNote={false}
                  />
                )}
                <EmailInviteBlock
                  inviteEmail={inviteEmail}
                  setInviteEmail={setInviteEmail}
                  inviteNickname={inviteNickname}
                  setInviteNickname={setInviteNickname}
                  submitInvite={submitInvite}
                  createInvitePending={createInvite.isPending}
                />
              </>
            )}
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
                <Spinner size={18} color={Colors.light.card} />
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
                <Spinner size={18} color={Colors.light.text} />
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

function HelpBullet({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.helpBullet}>
      <Text style={styles.helpDot}>•</Text>
      <Text style={styles.helpText}>
        <Text style={styles.helpTextBold}>{title}</Text> {body}
      </Text>
    </View>
  );
}

function RadioOption({
  selected,
  onPress,
  disabled,
  label,
}: {
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <Pressable style={styles.radioRow} onPress={onPress} disabled={disabled}>
      <View
        style={[styles.radioOuter, selected && styles.radioOuterSelected]}
      >
        {selected && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </Pressable>
  );
}

function InviteLinkBlock({
  code,
  inviteUrl,
  onShare,
  showInviteOnlyNote,
}: {
  code: string;
  inviteUrl: string;
  onShare: () => void;
  showInviteOnlyNote: boolean;
}) {
  return (
    <>
      <Text style={styles.sectionHeading}>Invite link</Text>
      {showInviteOnlyNote && (
        <Text style={styles.inviteNote}>
          Once you've invited people by email, you can also share this link.
        </Text>
      )}
      <View style={styles.inviteCard}>
        <Text style={styles.inviteCodeLabel}>JOIN CODE</Text>
        <Text style={styles.inviteCode} selectable>
          {code}
        </Text>
        <Text
          style={styles.inviteUrl}
          numberOfLines={1}
          ellipsizeMode="middle"
          selectable
        >
          {inviteUrl}
        </Text>
        <Pressable style={styles.shareBtn} onPress={onShare}>
          <Text style={styles.shareBtnText}>Share invite</Text>
        </Pressable>
      </View>
    </>
  );
}

function EmailInviteBlock({
  inviteEmail,
  setInviteEmail,
  inviteNickname,
  setInviteNickname,
  submitInvite,
  createInvitePending,
}: {
  inviteEmail: string;
  setInviteEmail: (v: string) => void;
  inviteNickname: string;
  setInviteNickname: (v: string) => void;
  submitInvite: () => void;
  createInvitePending: boolean;
}) {
  return (
    <>
      <Text style={styles.sectionHeading}>Invite a member via email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter email address"
        placeholderTextColor={Colors.light.muted}
        value={inviteEmail}
        onChangeText={setInviteEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        editable={!createInvitePending}
      />
      <TextInput
        style={[styles.input, styles.inputSpaced]}
        placeholder="Nickname"
        placeholderTextColor={Colors.light.muted}
        value={inviteNickname}
        onChangeText={setInviteNickname}
        autoCapitalize="words"
        maxLength={30}
        editable={!createInvitePending}
      />
      <Pressable
        style={[styles.primaryBtn, createInvitePending && styles.btnDimmed]}
        onPress={submitInvite}
        disabled={createInvitePending}
      >
        {createInvitePending ? (
          <Spinner size={18} color={Colors.light.card} />
        ) : (
          <Text style={styles.primaryBtnText}>Send invite</Text>
        )}
      </Pressable>
    </>
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
  helpToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  helpToggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.text,
  },
  helpChevron: {
    color: Colors.light.muted,
    fontSize: 14,
    transform: [{ rotate: "-90deg" }],
  },
  helpChevronOpen: { transform: [{ rotate: "0deg" }] },
  helpBody: {
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginTop: -8,
    paddingTop: 4,
    paddingBottom: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  helpBullet: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 8,
  },
  helpDot: {
    color: Colors.light.tint,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
  },
  helpText: {
    flex: 1,
    color: Colors.light.text,
    fontSize: 12,
    lineHeight: 18,
  },
  helpTextBold: {
    fontWeight: "700",
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
  statusOptionPressed: {
    opacity: 0.6,
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
  inviteNote: {
    fontSize: 12,
    color: Colors.light.muted,
    lineHeight: 16,
    marginBottom: 10,
    marginTop: -4,
  },
  inviteCard: {
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  inviteCodeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.light.muted,
    letterSpacing: 1.2,
  },
  inviteCode: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.light.tint,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    letterSpacing: 2,
    marginTop: 4,
  },
  inviteUrl: {
    fontSize: 12,
    color: Colors.light.muted,
    marginTop: 6,
    width: "100%",
    textAlign: "center",
  },
  shareBtn: {
    backgroundColor: Palette.green[700],
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: "stretch",
    alignItems: "center",
  },
  shareBtnText: {
    color: Colors.light.card,
    fontSize: 14,
    fontWeight: "600",
  },
  radioList: { gap: 10, marginTop: 4 },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: Colors.light.tint,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.tint,
  },
  radioLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
  },
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
