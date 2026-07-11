import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Colors, Palette } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";
import {
  getCurrentPermissionStatus,
  getRationaleDecision,
  requestPermissionAndGetToken,
  setRationaleDecision,
} from "@/lib/push-notifications";
import { trpc } from "@/lib/trpc";

export function PushRationaleModal() {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const setPushToken = trpc.user.setPushToken.useMutation();

  useEffect(() => {
    let cancelled = false;
    if (!session) return;

    (async () => {
      const decision = await getRationaleDecision();
      if (decision) return; // user already chose; don't bug them again
      const status = await getCurrentPermissionStatus();
      if (status === "granted" || status === "denied") {
        // System already has a decision — record it so we don't prompt again
        await setRationaleDecision(
          status === "granted" ? "accepted" : "declined"
        );
        return;
      }
      if (!cancelled) setOpen(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [session]);

  async function handleEnable() {
    setWorking(true);
    try {
      const token = await requestPermissionAndGetToken();
      await setRationaleDecision(token ? "accepted" : "declined");
      if (token) {
        try {
          await setPushToken.mutateAsync({ token });
        } catch {
          // swallow — token is captured locally; will retry next launch
        }
      }
      setOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      Alert.alert("Couldn't enable notifications", message);
    } finally {
      setWorking(false);
    }
  }

  async function handleSkip() {
    await setRationaleDecision("declined");
    setOpen(false);
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Stay in the game</Text>
          <Text style={styles.body}>
            Turn on notifications so we can ping you when:
          </Text>
          <View style={styles.bulletBlock}>
            <Bullet text="A pool you're in opens for picks" />
            <Bullet text="Picks lock before a tournament starts" />
            <Bullet text="Live scores shift the leaderboard" />
            <Bullet text="Someone invites you to a pool" />
          </View>
          <Pressable
            style={[styles.primaryBtn, working && styles.btnDimmed]}
            onPress={handleEnable}
            disabled={working}
          >
            <Text style={styles.primaryBtnText}>
              {working ? "Working…" : "Turn on notifications"}
            </Text>
          </Pressable>
          <Pressable style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 22,
    width: "100%",
    maxWidth: 380,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 6,
  },
  body: { fontSize: 14, color: Colors.light.muted, marginBottom: 12 },
  bulletBlock: { gap: 6, marginBottom: 18 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.green[700],
    marginTop: 7,
  },
  bulletText: { flex: 1, color: Colors.light.text, fontSize: 14 },
  primaryBtn: {
    backgroundColor: Palette.green[700],
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryBtnText: { color: Colors.light.card, fontWeight: "700", fontSize: 15 },
  btnDimmed: { opacity: 0.6 },
  skipBtn: { paddingVertical: 12, alignItems: "center", marginTop: 4 },
  skipText: { color: Colors.light.muted, fontSize: 14, fontWeight: "500" },
});
