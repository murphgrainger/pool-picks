import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
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
import { formatTournamentDates } from "@pool-picks/utils";

import { Spinner } from "@/components/spinner";
import { Colors, Palette } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

type JoinMode = "OPEN" | "INVITE_ONLY";

export default function CreatePoolScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [entryAmount, setEntryAmount] = useState("");
  const [tournamentId, setTournamentId] = useState<number | null>(null);
  const [joinMode, setJoinMode] = useState<JoinMode>("OPEN");
  const [tournamentPickerOpen, setTournamentPickerOpen] = useState(false);
  const [tournamentSearch, setTournamentSearch] = useState("");
  const [showConfigInfo, setShowConfigInfo] = useState(false);

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
    const amount = entryAmount.trim() === "" ? 0 : Number(entryAmount);
    if (Number.isNaN(amount) || amount < 0) {
      Alert.alert("Invalid entry amount", "Enter 0 or a positive dollar amount.");
      return;
    }
    createPool.mutate({
      name: name.trim(),
      username: username.trim(),
      amount_entry: amount,
      tournament_id: tournamentId,
      join_mode: joinMode,
    });
  }

  const tournaments = tournamentsQuery.data ?? [];
  const selectedTournament = useMemo(
    () => tournaments.find((t) => t.id === tournamentId) ?? null,
    [tournaments, tournamentId]
  );
  const filteredTournaments = useMemo(() => {
    const q = tournamentSearch.trim().toLowerCase();
    if (!q) return tournaments;
    return tournaments.filter((t) => t.name.toLowerCase().includes(q));
  }, [tournaments, tournamentSearch]);
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
          placeholder="i.e. Grainger Masters 2025"
          placeholderTextColor={Colors.light.muted}
          editable={!submitting}
          maxLength={60}
        />

        <Text style={styles.label}>Tournament</Text>
        {tournamentsQuery.isPending ? (
          <Spinner size={24} />
        ) : tournaments.length === 0 ? (
          <Text style={styles.helper}>
            No upcoming tournaments are available right now.
          </Text>
        ) : (
          <Pressable
            style={styles.selectField}
            onPress={() => setTournamentPickerOpen(true)}
            disabled={submitting}
          >
            <Text
              style={[
                styles.selectText,
                !selectedTournament && styles.selectPlaceholder,
              ]}
              numberOfLines={1}
            >
              {selectedTournament ? selectedTournament.name : "Search tournaments..."}
            </Text>
            <Text style={styles.selectChevron}>▾</Text>
          </Pressable>
        )}

        <Text style={styles.label}>Pool configuration</Text>
        <View style={styles.configCard}>
          <View style={styles.configCardHeader}>
            <Text style={styles.configTitle}>Pick 6, Count 4</Text>
            <Pressable
              onPress={() => setShowConfigInfo((v) => !v)}
              hitSlop={12}
            >
              <Text style={styles.infoIcon}>ⓘ</Text>
            </Pressable>
          </View>
          {showConfigInfo && (
            <View style={styles.configRules}>
              <Text style={styles.configRule}>• Pick 6 players for the tournament</Text>
              <Text style={styles.configRule}>• Max 3 picks from the A Group (top 20 OWGR)</Text>
              <Text style={styles.configRule}>• Your best 4 scores count toward your total</Text>
              <Text style={styles.configRule}>• Lowest total score wins</Text>
              <Text style={styles.configRule}>• DQ if fewer than 4 players make the cut</Text>
            </View>
          )}
          <Text style={styles.configHelper}>
            More configurations coming soon.
          </Text>
        </View>

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

        <Text style={styles.label}>Your commissioner nickname</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="e.g. MurphMoney"
          placeholderTextColor={Colors.light.muted}
          autoCapitalize="none"
          editable={!submitting}
          maxLength={20}
        />

        <Text style={styles.label}>How can people join this pool?</Text>
        <View style={styles.radioList}>
          <RadioOption
            selected={joinMode === "OPEN"}
            onPress={() => setJoinMode("OPEN")}
            disabled={submitting}
            label="Anyone with an invite link"
          />
          <RadioOption
            selected={joinMode === "INVITE_ONLY"}
            onPress={() => setJoinMode("INVITE_ONLY")}
            disabled={submitting}
            label="Only people I invite by email"
          />
        </View>

        <Pressable
          style={[styles.submitBtn, submitting && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <Spinner size={20} color={Colors.light.card} />
          ) : (
            <Text style={styles.submitText}>Create pool</Text>
          )}
        </Pressable>
      </ScrollView>

      <Modal
        visible={tournamentPickerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTournamentPickerOpen(false)}
      >
        <View style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select tournament</Text>
            <Pressable
              onPress={() => setTournamentPickerOpen(false)}
              hitSlop={12}
            >
              <Text style={styles.modalDone}>Done</Text>
            </Pressable>
          </View>
          <View style={styles.modalSearchRow}>
            <TextInput
              style={styles.modalSearchInput}
              value={tournamentSearch}
              onChangeText={setTournamentSearch}
              placeholder="Search tournaments..."
              placeholderTextColor={Colors.light.muted}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>
          <ScrollView contentContainerStyle={styles.modalListContent}>
            {filteredTournaments.length === 0 ? (
              <Text style={styles.helper}>No tournaments found</Text>
            ) : (
              filteredTournaments.map((t) => {
                const selected = t.id === tournamentId;
                return (
                  <Pressable
                    key={t.id}
                    style={[
                      styles.tournamentCard,
                      selected && styles.tournamentCardSelected,
                    ]}
                    onPress={() => {
                      setTournamentId(t.id);
                      setTournamentPickerOpen(false);
                      setTournamentSearch("");
                    }}
                  >
                    <Text
                      style={[
                        styles.tournamentName,
                        selected && styles.tournamentNameSelected,
                      ]}
                    >
                      {t.name}
                    </Text>
                    {t.course && (
                      <Text style={styles.tournamentMeta}>{t.course}</Text>
                    )}
                    <Text style={styles.tournamentMeta}>
                      {formatTournamentDates(t.start_date, t.end_date)}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
    <Pressable
      style={styles.radioRow}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </Pressable>
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
    marginTop: 16,
  },
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
  selectField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectText: { flex: 1, fontSize: 16, color: Colors.light.text },
  selectPlaceholder: { color: Colors.light.muted },
  selectChevron: { color: Colors.light.muted, fontSize: 14, marginLeft: 8 },
  configCard: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    borderRadius: 10,
    padding: 14,
  },
  configCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  configTitle: { fontSize: 15, fontWeight: "600", color: Colors.light.text },
  infoIcon: { fontSize: 18, color: Colors.light.muted },
  configRules: { marginTop: 10, gap: 4 },
  configRule: { fontSize: 12, color: Colors.light.muted, lineHeight: 18 },
  configHelper: {
    marginTop: 10,
    fontSize: 12,
    color: Colors.light.muted,
    fontStyle: "italic",
  },
  radioList: { gap: 10, marginTop: 4 },
  radioRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: { borderColor: Palette.green[700] },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.green[700],
  },
  radioLabel: { fontSize: 14, color: Colors.light.text },
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
  modalRoot: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: Colors.light.text },
  modalDone: { color: Colors.light.tint, fontSize: 15, fontWeight: "600" },
  modalSearchRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalSearchInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    color: Colors.light.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  modalListContent: { padding: 16 },
});
