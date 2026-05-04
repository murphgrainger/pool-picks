import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/theme";

export default function PicksScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pool #{id} — picks</Text>
      <Text style={styles.note}>Picks form coming next.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 24,
    gap: 8,
  },
  title: { fontSize: 22, fontWeight: "700", color: Colors.light.text },
  note: { color: Colors.light.muted },
});
