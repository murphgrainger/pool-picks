import { Ionicons } from "@expo/vector-icons";
import { Redirect, Stack, useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable } from "react-native";

import { PushRationaleModal } from "@/components/push-rationale-modal";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";

export default function AppLayout() {
  const { session, loading } = useAuth();
  const router = useRouter();

  const renderHomeRight = useCallback(
    () => (
      <Pressable
        hitSlop={12}
        onPress={() => router.push("/(app)/pool/create")}
        style={{
          width: 32,
          height: 32,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="add" size={28} color={Colors.light.tint} />
      </Pressable>
    ),
    [router]
  );

  if (loading) return null;
  if (!session) return <Redirect href="/(auth)/sign-in" />;

  return (
    <>
    <PushRationaleModal />
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
          title: "Home",
          headerRight: renderHomeRight,
        }}
      />
      <Stack.Screen name="pool/[id]/index" options={{ title: "Pool" }} />
      <Stack.Screen
        name="pool/[id]/picks"
        options={{ title: "Picks" }}
      />
      <Stack.Screen
        name="pool/[id]/admin"
        options={{ title: "Commissioner" }}
      />
      <Stack.Screen
        name="pool/create"
        options={{ title: "New pool", presentation: "modal" }}
      />
    </Stack>
    </>
  );
}
