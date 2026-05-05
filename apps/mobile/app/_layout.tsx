import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Sentry from "@sentry/react-native";
import "react-native-reanimated";

import { Providers } from "@/lib/providers";

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    sendDefaultPii: false,
  });
}

function RootLayout() {
  return (
    <Providers>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <StatusBar style="auto" />
    </Providers>
  );
}

export default Sentry.wrap(RootLayout);
