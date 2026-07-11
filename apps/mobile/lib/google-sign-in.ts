import * as AuthSession from "expo-auth-session";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";

import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
};

function randomNonce(length = 32): string {
  const bytes = Crypto.getRandomBytes(length);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function reverseDnsForIosClient(clientId: string): string {
  const prefix = clientId.replace(/\.apps\.googleusercontent\.com$/, "");
  return `com.googleusercontent.apps.${prefix}`;
}

export async function signInWithGoogle(): Promise<{ error?: string }> {
  if (!iosClientId) {
    return {
      error:
        "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID is not set. Add it to /.env and restart Metro with --clear.",
    };
  }

  // Apple-style nonce: generate raw, hash for the provider, pass raw to
  // Supabase so its server-side SHA256(raw) equals id_token.nonce.
  const rawNonce = randomNonce();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  // iOS OAuth clients in Google Cloud expect the redirect URI to use the
  // reverse-DNS form of the client ID. The same scheme is already registered
  // by the @react-native-google-signin Expo plugin in app.json.
  const redirectUri = `${reverseDnsForIosClient(iosClientId)}:/oauth2redirect/google`;

  // Google rejects response_type=id_token for iOS clients
  // (unsupported_response_type). Native clients must use the authorization
  // code flow with PKCE, then exchange the code — the token response carries
  // the id_token, and iOS clients need no client secret for the exchange.
  const request = new AuthSession.AuthRequest({
    clientId: iosClientId,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    scopes: ["openid", "profile", "email"],
    extraParams: { nonce: hashedNonce },
  });

  try {
    const result = await request.promptAsync(discovery);

    if (result.type === "cancel" || result.type === "dismiss") {
      return {};
    }
    if (result.type !== "success") {
      return { error: `Google sign-in failed: ${result.type}` };
    }

    const code = result.params.code;
    if (!code) {
      return { error: "Google did not return an authorization code." };
    }

    const tokens = await AuthSession.exchangeCodeAsync(
      {
        clientId: iosClientId,
        code,
        redirectUri,
        extraParams: request.codeVerifier
          ? { code_verifier: request.codeVerifier }
          : undefined,
      },
      discovery
    );

    const idToken = tokens.idToken;
    if (!idToken) {
      return { error: "Google did not return an identity token." };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
      nonce: rawNonce,
    });

    if (error) return { error: error.message };
    return {};
  } catch (e: unknown) {
    return {
      error: e instanceof Error ? e.message : "Google Sign In failed",
    };
  }
}
