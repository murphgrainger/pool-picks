import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Spinner } from "@/components/spinner";
import { Colors } from "@/constants/theme";
import { signInWithApple } from "@/lib/apple-sign-in";
import { supabase } from "@/lib/supabase";

type Step = "email" | "code";

export default function SignInScreen() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [appleSubmitting, setAppleSubmitting] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

  async function handleAppleSignIn() {
    setAppleSubmitting(true);
    const { error } = await signInWithApple();
    setAppleSubmitting(false);
    if (error) Alert.alert("Sign in with Apple failed", error);
  }

  async function sendCode() {
    if (!email.trim()) {
      Alert.alert("Email required", "Enter your email to receive a sign-in code.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    setSubmitting(false);
    if (error) {
      Alert.alert("Couldn't send code", error.message);
      return;
    }
    setStep("code");
  }

  async function verifyCode() {
    if (!code.trim()) {
      Alert.alert("Code required", "Enter the 6-digit code we emailed you.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: "email",
    });
    setSubmitting(false);
    if (error) {
      Alert.alert("Invalid code", error.message);
      return;
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <View style={styles.container}>
          <View style={styles.brandBlock}>
            <Text style={styles.brand}>PoolPicks</Text>
            <Text style={styles.tagline}>Golf pools with your friends</Text>
          </View>

          {step === "email" && appleAvailable && (
            <View style={styles.appleBlock}>
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={
                  AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                }
                buttonStyle={
                  AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={10}
                style={styles.appleBtn}
                onPress={() => {
                  if (!appleSubmitting) handleAppleSignIn();
                }}
              />
              {appleSubmitting && (
                <View style={styles.appleSpinner}>
                  <Spinner size={20} color={Colors.light.muted} />
                </View>
              )}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>
            </View>
          )}

          {step === "email" ? (
            <View style={styles.formBlock}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor={Colors.light.muted}
                editable={!submitting}
                returnKeyType="send"
                onSubmitEditing={sendCode}
              />
              <Pressable
                style={[styles.primaryBtn, submitting && styles.btnDisabled]}
                onPress={sendCode}
                disabled={submitting}
              >
                {submitting ? (
                  <Spinner size={20} color={Colors.light.card} />
                ) : (
                  <Text style={styles.primaryBtnText}>Send sign-in code</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.formBlock}>
              <Text style={styles.helper}>
                Enter the 6-digit code we sent to{" "}
                <Text style={styles.helperEmphasis}>{email}</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                editable={!submitting}
                returnKeyType="done"
                onSubmitEditing={verifyCode}
              />
              <Pressable
                style={[styles.primaryBtn, submitting && styles.btnDisabled]}
                onPress={verifyCode}
                disabled={submitting}
              >
                {submitting ? (
                  <Spinner size={20} color={Colors.light.card} />
                ) : (
                  <Text style={styles.primaryBtnText}>Verify and sign in</Text>
                )}
              </Pressable>
              <Pressable
                style={styles.linkBtn}
                onPress={() => {
                  setCode("");
                  setStep("email");
                }}
                disabled={submitting}
              >
                <Text style={styles.linkBtnText}>Use a different email</Text>
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  brandBlock: { alignItems: "center", marginBottom: 48 },
  brand: {
    fontSize: 40,
    fontWeight: "800",
    color: Colors.light.tint,
    letterSpacing: -1,
  },
  tagline: { marginTop: 8, fontSize: 16, color: Colors.light.muted },
  formBlock: { gap: 12 },
  label: { fontSize: 14, fontWeight: "600", color: Colors.light.text },
  helper: { fontSize: 14, color: Colors.light.muted, marginBottom: 4 },
  helperEmphasis: { color: Colors.light.text, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    color: Colors.light.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
  },
  codeInput: { fontSize: 22, textAlign: "center" },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: Colors.light.tint,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryBtnText: { color: Colors.light.card, fontSize: 16, fontWeight: "600" },
  btnDisabled: { opacity: 0.6 },
  linkBtn: { paddingVertical: 12, alignItems: "center" },
  linkBtnText: { color: Colors.light.tint, fontSize: 14, fontWeight: "500" },
  appleBlock: { marginBottom: 8 },
  appleBtn: { width: "100%", height: 48 },
  appleSpinner: { marginTop: 8 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
    marginBottom: 4,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.border,
  },
  dividerText: { color: Colors.light.muted, fontSize: 12 },
});
