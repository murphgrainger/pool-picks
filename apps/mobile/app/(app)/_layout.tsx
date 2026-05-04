import { Redirect, Stack } from "expo-router";

import { Colors } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";

export default function AppLayout() {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (!session) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.light.background },
        headerTintColor: Colors.light.tint,
        headerTitleStyle: { color: Colors.light.text },
      }}
    >
      <Stack.Screen name="index" options={{ title: "PoolPicks" }} />
    </Stack>
  );
}
