import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors, Palette } from "@/constants/theme";

export type PendingInvite = {
  id: number;
  nickname: string;
  pool: { id: number; name: string; status: string; amount_entry: number };
};

type Props = {
  invite: PendingInvite;
  onAccept: () => void;
  onDecline: () => void;
  busyAction: "accept" | "decline" | null;
};

export function PendingInviteCard({
  invite,
  onAccept,
  onDecline,
  busyAction,
}: Props) {
  const disabled = busyAction !== null;
  return (
    <View style={styles.card}>
      <Text style={styles.intro}>You've been invited to:</Text>
      <Text style={styles.poolName}>{invite.pool.name}</Text>
      {invite.pool.amount_entry > 0 && (
        <Text style={styles.ante}>${invite.pool.amount_entry} ante</Text>
      )}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.declineBtn,
            (disabled || pressed) && styles.btnDimmed,
          ]}
          onPress={onDecline}
          disabled={disabled}
        >
          {busyAction === "decline" ? (
            <ActivityIndicator color={Colors.light.card} />
          ) : (
            <Text style={styles.declineText}>Decline</Text>
          )}
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.acceptBtn,
            (disabled || pressed) && styles.btnDimmed,
          ]}
          onPress={onAccept}
          disabled={disabled}
        >
          {busyAction === "accept" ? (
            <ActivityIndicator color={Colors.light.card} />
          ) : (
            <Text style={styles.acceptText}>Accept</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: `${Palette.gold}1a`,
    borderWidth: 1,
    borderColor: `${Palette.gold}55`,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  intro: { fontSize: 13, color: Colors.light.muted },
  poolName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
    marginTop: 4,
  },
  ante: { fontSize: 13, color: Colors.light.muted, marginTop: 2 },
  actions: { flexDirection: "row", gap: 10, marginTop: 14 },
  declineBtn: {
    flex: 1,
    backgroundColor: "#dc2626",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 110,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: Palette.green[700],
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 110,
  },
  declineText: { color: Colors.light.card, fontWeight: "600", fontSize: 14 },
  acceptText: { color: Colors.light.card, fontWeight: "600", fontSize: 14 },
  btnDimmed: { opacity: 0.6 },
});
