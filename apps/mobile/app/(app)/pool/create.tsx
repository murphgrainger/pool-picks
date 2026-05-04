import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { formatTournamentDates } from "@pool-picks/utils";

import { Colors, Palette } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

export default function CreatePoolScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [entryAmount, setEntryAmount] = useState("0");
  const [tournamentId, setTournamentId] = useState<number | null>(null);

  const tournamentsQuery = trpc.tournament.listSelectable.useQuery();
  const utils = trpc.useUtils();

  const createPool = trpc.pool.create.useMutation({
    onSuccess: async (pool) => {
      await utils.poolMember.listByUser.invalidate();
      router.replace(`/(app)/pool/${pool.id}`);
    },
    onError: (err) => {
      Alert.alert("Couldn't create pool", err.message);
    },
  });

  function handleSubmit() {
    if (!name.trim() || !username.trim() || tournamentId === null) {
      Alert.alert(
        "Missing info",
        "Pick a tournament and fill in pool name + your username."
      );
      return;
    }
    const amount = Number(entryAmount);
    if (Number.isNaN(amount) || amount < 0) {
      Alert.alert("Invalid entry amount", "Enter 0 or a positive dollar amount.");
      return;
    }
    createPool.mutate({
      name: name.trim(),
      username: username.trim(),
      amount_entry: amount,
      tournament_id: tournamentId,
      join_mode: "INVITE_ONLY",
    });
  }

  const tournaments = tournamentsQuery.data ?? [];
  const submitting = createPool.isPending;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Pool name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Sunday Pints Masters Pool"
          placeholderTextColor={Colors.light.muted}
          editable={!submitting}
          maxLength={60}
        />

        <Text style={styles.label}>Your username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="What your friends will see in this pool"
          placeholderTextColor={Colors.light.muted}
          autoCapitalize="none"
          editable={!submitting}
          maxLength={20}
        />

        <Text style={styles.label}>Entry amount (USD)</Text>
        <TextInput
          style={styles.input}
          value={entryAmount}
          onChangeText={setEntryAmount}
          placeholder="0"
          placeholderTextColor={Colors.light.muted}
          keyboardType="number-pad"
          editable={!submitting}
        />

        <Text style={[styles.label, styles.tournamentLabel]}>Tournament</Text>
        {tournamentsQuery.isPending ? (
          <ActivityIndicator color={Colors.light.tint} />
        ) : tournaments.length === 0 ? (
          <Text style={styles.helper}>
            No upcoming tournaments are available right now.
          </Text>
        ) : (
          tournaments.map((t) => {
            const selected = t.id === tournamentId;
            return (
              <Pressable
                key={t.id}
                style={[
                  styles.tournamentCard,
                  selected && styles.tournamentCardSelected,
                ]}
                onPress={() => setTournamentId(t.id)}
                disabled={submitting}
              >
                <Text
                  style={[
                    styles.tournamentName,
                    selected && styles.tournamentNameSelected,
                  ]}
                >
                  {t.name}
                </Text>
                {t.course && <Text style={styles.tournamentMeta}>{t.course}</Text>}
                <Text style={styles.tournamentMeta}>
                  {formatTournamentDates(t.start_date, t.end_date)}
                </Text>
              </Pressable>
            );
          })
        )}

        <Pressable
          style={[styles.submitBtn, submitting && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.light.card} />
          ) : (
            <Text style={styles.submitText}>Create pool</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 64 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 6,
    marginTop: 12,
  },
  tournamentLabel: { marginTop: 18 },
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
  helper: { color: Colors.light.muted, fontSize: 13 },
  tournamentCard: {
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  tournamentCardSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: Palette.green[50],
  },
  tournamentName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
  },
  tournamentNameSelected: { color: Colors.light.tint },
  tournamentMeta: {
    fontSize: 12,
    color: Colors.light.muted,
    marginTop: 2,
  },
  submitBtn: {
    marginTop: 24,
    backgroundColor: Colors.light.tint,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: { color: Colors.light.card, fontWeight: "700", fontSize: 16 },
  btnDisabled: { opacity: 0.6 },
});
