import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Spinner } from "@/components/spinner";
import { Colors, Palette } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

export default function JoinByCodeScreen() {
  const { code: rawCode } = useLocalSearchParams<{ code: string }>();
  const code = (rawCode ?? "").toUpperCase();
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [username, setUsername] = useState("");
  const utils = trpc.useUtils();

  const poolQuery = trpc.pool.getByInviteCode.useQuery(
    { code },
    { enabled: code.length > 0, retry: false }
  );
  const membershipsQuery = trpc.poolMember.listByUser.useQuery(undefined, {
    enabled: !!session,
  });

  const pool = poolQuery.data ?? null;
  const alreadyMember =
    !!session &&
    !!pool &&
    !!membershipsQuery.data &&
    membershipsQuery.data.some((m) => m.pool.id === pool.id);

  useEffect(() => {
    if (alreadyMember && pool) {
      router.replace(`/(app)/pool/${pool.id}`);
    }
  }, [alreadyMember, pool, router]);

  const joinMutation = trpc.pool.joinByCode.useMutation({
    onSuccess: async (data) => {
      await Promise.all([
        utils.poolMember.listByUser.invalidate(),
        utils.poolInvite.listPending.invalidate(),
      ]);
      router.replace(`/(app)/pool/${data.poolId}`);
    },
    onError: (err) => {
      if (pool && err.message.toLowerCase().includes("already a member")) {
        router.replace(`/(app)/pool/${pool.id}`);
        return;
      }
      Alert.alert("Couldn't join pool", err.message);
    },
  });

  function handleSubmit() {
    const trimmed = username.trim();
    if (!trimmed) {
      Alert.alert("Nickname required", "Enter a nickname to join this pool.");
      return;
    }
    joinMutation.mutate({ code, username: trimmed });
  }

  // Loading: auth resolving, pool fetch in flight, or already-member redirect about to fire
  const stillResolving =
    authLoading ||
    poolQuery.isLoading ||
    (!!session && membershipsQuery.isLoading) ||
    alreadyMember;

  if (stillResolving) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Spinner size={36} />
        </View>
      </SafeAreaView>
    );
  }

  if (poolQuery.error || !pool) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <View style={styles.card}>
            <Text style={styles.heading}>Pool not found</Text>
            <Text style={styles.helpText}>
              The invite link you used isn't valid. Double-check the code or
              ask the commissioner for a fresh link.
            </Text>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() =>
                session ? router.replace("/(app)") : router.replace("/(auth)/sign-in")
              }
            >
              <Text style={styles.secondaryBtnText}>
                {session ? "Back to home" : "Sign in"}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const poolAccepting = pool.status === "Setup" || pool.status === "Open";
  const memberCount = pool._count.pool_members;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <View style={styles.centered}>
          <View style={styles.card}>
            <Text style={styles.heading}>{pool.name}</Text>
            <Text style={styles.tournament}>{pool.tournament.name}</Text>
            {pool.tournament.course && (
              <Text style={styles.course}>{pool.tournament.course}</Text>
            )}

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {memberCount} member{memberCount === 1 ? "" : "s"}
              </Text>
              {pool.amount_entry > 0 && (
                <Text style={styles.metaText}>${pool.amount_entry} entry</Text>
              )}
            </View>

            {!session && (
              poolAccepting ? (
                <Pressable
                  style={styles.primaryBtn}
                  onPress={() => router.push("/(auth)/sign-in")}
                >
                  <Text style={styles.primaryBtnText}>Sign in to join</Text>
                </Pressable>
              ) : (
                <Text style={styles.helpText}>
                  This pool is no longer accepting new members.
                </Text>
              )
            )}

            {session && !poolAccepting && (
              <Text style={styles.helpText}>
                This pool is no longer accepting new members.
              </Text>
            )}

            {session && poolAccepting && (
              <>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Your nickname"
                  placeholderTextColor={Colors.light.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!joinMutation.isPending}
                  returnKeyType="send"
                  onSubmitEditing={handleSubmit}
                />
                <Pressable
                  style={[
                    styles.primaryBtn,
                    (joinMutation.isPending || !username.trim()) &&
                      styles.btnDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={joinMutation.isPending || !username.trim()}
                >
                  {joinMutation.isPending ? (
                    <Spinner size={20} color={Colors.light.card} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Join Pool</Text>
                  )}
                </Pressable>
                {pool.join_mode !== "OPEN" && (
                  <Text style={styles.subtleText}>
                    This pool is invite-only. You'll only be able to join if the
                    commissioner has invited your email.
                  </Text>
                )}
              </>
            )}

            <Pressable
              style={styles.linkBtn}
              onPress={() =>
                session ? router.replace("/(app)") : router.replace("/(auth)/sign-in")
              }
            >
              <Text style={styles.linkBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  flex: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 28,
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
    textAlign: "center",
  },
  tournament: {
    marginTop: 6,
    fontSize: 15,
    color: Colors.light.muted,
    textAlign: "center",
  },
  course: {
    marginTop: 2,
    fontSize: 13,
    color: Colors.light.muted,
    textAlign: "center",
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 14,
    marginBottom: 20,
  },
  metaText: { fontSize: 13, color: Colors.light.muted },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    color: Colors.light.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: Palette.green[700],
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryBtnText: { color: Colors.light.card, fontSize: 16, fontWeight: "600" },
  btnDisabled: { opacity: 0.5 },
  secondaryBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  secondaryBtnText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: "600",
  },
  helpText: {
    fontSize: 14,
    color: Colors.light.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  subtleText: {
    marginTop: 12,
    fontSize: 12,
    color: Colors.light.muted,
    textAlign: "center",
  },
  linkBtn: { marginTop: 14, paddingVertical: 8 },
  linkBtnText: {
    color: Colors.light.muted,
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
