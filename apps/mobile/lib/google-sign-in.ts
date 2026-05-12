import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";

import { supabase } from "./supabase";

const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

let configured = false;

function ensureConfigured() {
  if (configured) return;
  if (!iosClientId) {
    throw new Error(
      "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID is not set. Add it to /.env and restart Metro with --clear."
    );
  }
  GoogleSignin.configure({ iosClientId });
  configured = true;
}

export async function signInWithGoogle(): Promise<{ error?: string }> {
  try {
    ensureConfigured();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      return {};
    }

    const idToken = response.data.idToken;
    if (!idToken) {
      return { error: "Google did not return an identity token." };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });

    if (error) return { error: error.message };
    return {};
  } catch (e: unknown) {
    if (isErrorWithCode(e)) {
      if (
        e.code === statusCodes.SIGN_IN_CANCELLED ||
        e.code === statusCodes.IN_PROGRESS
      ) {
        return {};
      }
    }
    return {
      error: e instanceof Error ? e.message : "Google Sign In failed",
    };
  }
}
