import { Redirect, Stack, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { Colors } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";

export default function AppLayout() {
  const { session, loading } = useAuth();
  const router = useRouter();

  if (loading) return null;
  if (!session) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.light.background },
        headerTintColor: Colors.light.tint,
        headerTitleStyle: { color: Colors.light.text, fontWeight: "700" },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "PoolPicks",
          headerRight: () => (
            <Pressable
              hitSlop={12}
              onPress={() => router.push("/(app)/pool/create")}
            >
              <Text style={styles.headerBtn}>＋</Text>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="pool/[id]" options={{ title: "Pool" }} />
      <Stack.Screen
        name="pool/create"
        options={{ title: "New pool", presentation: "modal" }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    fontSize: 28,
    color: Colors.light.tint,
    fontWeight: "300",
    paddingHorizontal: 4,
  },
});
