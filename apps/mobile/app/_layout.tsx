import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
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
      <ThemeProvider value={DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="join/[code]" />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </Providers>
  );
}

export default Sentry.wrap(RootLayout);
