import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { Colors } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: Colors.light.background,
        }}
      >
        <ActivityIndicator color={Colors.light.tint} />
      </View>
    );
  }

  return <Redirect href={session ? "/(app)" : "/(auth)/sign-in"} />;
}
