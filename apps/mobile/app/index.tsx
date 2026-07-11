import { Redirect } from "expo-router";
import { View } from "react-native";

import { Spinner } from "@/components/spinner";
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
        <Spinner size={36} />
      </View>
    );
  }

  return <Redirect href={session ? "/(app)" : "/(auth)/sign-in"} />;
}
