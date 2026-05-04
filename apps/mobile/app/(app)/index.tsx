import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";

export default function HomeScreen() {
  const { session, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome to PoolPicks</Text>
      <Text style={styles.subtle}>Signed in as {session?.user.email}</Text>
      <Pressable style={styles.btn} onPress={signOut}>
        <Text style={styles.btnText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 24,
    gap: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
  },
  subtle: { color: Colors.light.muted, fontSize: 14 },
  btn: {
    marginTop: 24,
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  btnText: { color: Colors.light.text, fontSize: 14, fontWeight: "500" },
});
