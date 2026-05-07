import { Redirect, Stack, useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable } from "react-native";
import Svg, { Path } from "react-native-svg";

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
        style={{ width: 44, alignItems: "center" }}
      >
        <Svg width={26} height={26} viewBox="0 0 24 24">
          <Path
            d="M12 5 V19 M5 12 H19"
            stroke={Colors.light.tint}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </Svg>
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
