import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  MAX_A_GROUP_PICKS,
  PICKS_PER_MEMBER,
} from "@pool-picks/utils";

import { Colors, Palette } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

type Athlete = {
  id: number;
  full_name: string;
  ranking: number | null;
};

function isAGroup(a: Athlete): boolean {
  return a.ranking !== null && a.ranking <= 20;
}

export default function PicksScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const poolId = Number(id);
  const { session } = useAuth();

  const poolQuery = trpc.pool.getById.useQuery({ id: poolId });
  const tournamentId = poolQuery.data?.tournament_id ?? null;

  const athletesQuery = trpc.athlete.listByTournament.useQuery(
    tournamentId !== null ? { tournament_id: tournamentId } : { tournament_id: 0 },
    { enabled: tournamentId !== null }
  );

  const utils = trpc.useUtils();
  const submitPicks = trpc.poolMember.submitPicks.useMutation({
    onSuccess: async () => {
      await utils.pool.getById.invalidate({ id: poolId });
      await utils.poolMember.listByUser.invalidate();
      router.back();
    },
    onError: (err) => Alert.alert("Couldn't submit picks", err.message),
  });

  const currentMember = poolQuery.data?.pool_members.find(
    (m) => m.user.email === session?.user.email
  );

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hydrated || !currentMember) return;
    const existing = currentMember.athletes.map((a) => a.athlete.id);
    if (existing.length) setSelectedIds(existing);
    setHydrated(true);
  }, [currentMember, hydrated]);

  const athletes = (athletesQuery.data ?? []) as Athlete[];

  const aGroupCount = useMemo(
    () =>
      selectedIds.filter((sid) => {
        const a = athletes.find((x) => x.id === sid);
        return a ? isAGroup(a) : false;
      }).length,
    [selectedIds, athletes]
  );

  const filteredAthletes = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...athletes].sort((a, b) => {
      // Selected first, then by ranking (A-group first), then by name
      const aSelected = selectedIds.includes(a.id);
      const bSelected = selectedIds.includes(b.id);
      if (aSelected !== bSelected) return aSelected ? -1 : 1;
      const aRank = a.ranking ?? 9999;
      const bRank = b.ranking ?? 9999;
      if (aRank !== bRank) return aRank - bRank;
      return a.full_name.localeCompare(b.full_name);
    });
    if (!q) return sorted;
    return sorted.filter((a) => a.full_name.toLowerCase().includes(q));
  }, [athletes, selectedIds, search]);

  const allReady =
    selectedIds.length === PICKS_PER_MEMBER &&
    aGroupCount <= MAX_A_GROUP_PICKS;

  function toggleAthlete(athlete: Athlete) {
    setSelectedIds((prev) => {
      if (prev.includes(athlete.id)) {
        setSearch("");
        return prev.filter((id) => id !== athlete.id);
      }
      if (prev.length >= PICKS_PER_MEMBER) {
        Alert.alert("All slots filled", `You already have ${PICKS_PER_MEMBER} picks. Tap one to remove it before adding another.`);
        return prev;
      }
      if (
        isAGroup(athlete) &&
        prev.filter((id) => {
          const a = athletes.find((x) => x.id === id);
          return a && isAGroup(a);
        }).length >= MAX_A_GROUP_PICKS
      ) {
        Alert.alert(
          "A-Group limit",
          `You can only pick ${MAX_A_GROUP_PICKS} athletes from the top 20.`
        );
        return prev;
      }
      setSearch("");
      return [...prev, athlete.id];
    });
  }

  function handleSubmit() {
    if (!currentMember) return;
    if (selectedIds.length !== PICKS_PER_MEMBER) {
      Alert.alert(
        "Pick all 6",
        `Select ${PICKS_PER_MEMBER} athletes before submitting.`
      );
      return;
    }
    submitPicks.mutate({
      poolMemberId: currentMember.id,
      athleteIds: selectedIds,
    });
  }

  if (poolQuery.isPending || athletesQuery.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.light.tint} />
      </View>
    );
  }

  if (poolQuery.isError || athletesQuery.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Couldn't load athletes</Text>
        <Text style={styles.errorBody}>
          {poolQuery.error?.message || athletesQuery.error?.message}
        </Text>
      </View>
    );
  }

  if (!currentMember) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>You're not in this pool</Text>
        <Text style={styles.errorBody}>Only pool members can submit picks.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.summary}>
        <View>
          <Text style={styles.summaryLabel}>Picks</Text>
          <Text
            style={[
              styles.summaryValue,
              selectedIds.length === PICKS_PER_MEMBER && styles.summaryValueDone,
            ]}
          >
            {selectedIds.length} / {PICKS_PER_MEMBER}
          </Text>
        </View>
        <View>
          <Text style={styles.summaryLabel}>A-Group (top 20)</Text>
          <Text
            style={[
              styles.summaryValue,
              aGroupCount > MAX_A_GROUP_PICKS && styles.summaryValueOver,
            ]}
          >
            {aGroupCount} / {MAX_A_GROUP_PICKS}
          </Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search athletes"
          placeholderTextColor={Colors.light.muted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filteredAthletes}
        keyExtractor={(a: Athlete) => String(a.id)}
        renderItem={({ item }: { item: Athlete }) => (
          <AthleteRow
            athlete={item}
            selected={selectedIds.includes(item.id)}
            slotNumber={selectedIds.indexOf(item.id) + 1}
            onPress={() => toggleAthlete(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        initialNumToRender={20}
        windowSize={10}
      />

      <View style={styles.footer}>
        <Pressable
          style={[
            styles.submitBtn,
            !allReady && styles.submitBtnDisabled,
            submitPicks.isPending && styles.btnDimmed,
          ]}
          onPress={handleSubmit}
          disabled={!allReady || submitPicks.isPending}
        >
          {submitPicks.isPending ? (
            <ActivityIndicator color={Colors.light.card} />
          ) : (
            <Text style={styles.submitText}>
              {currentMember.athletes.length === PICKS_PER_MEMBER
                ? "Update picks"
                : "Submit picks"}
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function AthleteRow({
  athlete,
  selected,
  slotNumber,
  onPress,
}: {
  athlete: Athlete;
  selected: boolean;
  slotNumber: number;
  onPress: () => void;
}) {
  const aGroup = isAGroup(athlete);
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && styles.rowPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.rowLeft}>
        {selected ? (
          <View style={styles.slotPill}>
            <Text style={styles.slotText}>{slotNumber}</Text>
          </View>
        ) : (
          <View style={styles.slotPlaceholder} />
        )}
        <View style={styles.rowMain}>
          <Text
            style={[styles.athleteName, selected && styles.athleteNameSelected]}
            numberOfLines={1}
          >
            {athlete.full_name}
          </Text>
          {athlete.ranking !== null && (
            <Text style={styles.athleteRank}>
              World #{athlete.ranking}
              {aGroup && <Text style={styles.aGroupTag}>  •  A-Group</Text>}
            </Text>
          )}
        </View>
      </View>
      {aGroup && !selected && <View style={styles.aGroupBadge} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.light.background },
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
  },
  summary: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  summaryLabel: { fontSize: 11, color: Colors.light.muted },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
    marginTop: 2,
  },
  summaryValueDone: { color: Colors.light.tint },
  summaryValueOver: { color: Colors.light.danger },
  searchRow: { paddingHorizontal: 16, paddingVertical: 10 },
  searchInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    color: Colors.light.text,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  rowSelected: {
    borderColor: Palette.green[700],
    backgroundColor: Palette.green[50],
  },
  rowPressed: { opacity: 0.7 },
  rowLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  rowMain: { flex: 1, minWidth: 0 },
  slotPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Palette.green[700],
    alignItems: "center",
    justifyContent: "center",
  },
  slotText: { color: Colors.light.card, fontWeight: "700", fontSize: 12 },
  slotPlaceholder: { width: 26 },
  athleteName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
  },
  athleteNameSelected: { color: Palette.green[700] },
  athleteRank: {
    fontSize: 12,
    color: Colors.light.muted,
    marginTop: 2,
  },
  aGroupTag: { color: Palette.yellow, fontWeight: "600" },
  aGroupBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.yellow,
  },
  footer: {
    padding: 16,
    paddingBottom: 28,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  submitBtn: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitBtnDisabled: {
    backgroundColor: Palette.grey[300],
  },
  submitText: { color: Colors.light.card, fontWeight: "700", fontSize: 16 },
  btnDimmed: { opacity: 0.6 },
});
