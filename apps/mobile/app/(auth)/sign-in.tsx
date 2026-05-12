import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputKeyPressEventData,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Spinner } from "@/components/spinner";
import { Colors } from "@/constants/theme";
import { signInWithApple } from "@/lib/apple-sign-in";
import { supabase } from "@/lib/supabase";

type Step = "email" | "code";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

export default function SignInScreen() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(() => Array(OTP_LENGTH).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [appleSubmitting, setAppleSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

  useEffect(() => {
    if (step === "code") {
      const t = setTimeout(() => inputRefs.current[0]?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [step]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(
      () => setResendCooldown((c) => c - 1),
      1000
    );
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const otpString = otp.join("");

  function updateOtp(index: number, value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length > 1) {
      const next = [...otp];
      for (let i = 0; i < OTP_LENGTH; i++) {
        next[i] = digits[i] ?? "";
      }
      setOtp(next);
      const focusTarget = Math.min(digits.length, OTP_LENGTH - 1);
      inputRefs.current[focusTarget]?.focus();
      return;
    }
    const digit = digits.slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKey(
    index: number,
    e: NativeSyntheticEvent<TextInputKeyPressEventData>
  ) {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const next = [...otp];
      next[index - 1] = "";
      setOtp(next);
    }
  }

  async function handleAppleSignIn() {
    setAppleSubmitting(true);
    const { error } = await signInWithApple();
    setAppleSubmitting(false);
    if (error) Alert.alert("Sign in with Apple failed", error);
  }

  async function sendCode() {
    if (!email.trim()) {
      Alert.alert(
        "Email required",
        "Enter your email to receive a sign-in code."
      );
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
    setOtp(Array(OTP_LENGTH).fill(""));
    setStep("code");
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  }

  async function verifyCode() {
    if (otpString.length !== OTP_LENGTH) return;
    setSubmitting(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otpString,
      type: "email",
    });
    setSubmitting(false);
    if (error) {
      Alert.alert("Invalid code", error.message);
      return;
    }
  }

  async function resendCode() {
    if (resendCooldown > 0) return;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    if (error) {
      Alert.alert("Couldn't resend code", error.message);
      return;
    }
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <View style={styles.container}>
          {step === "email" ? (
            <>
              <View style={styles.brandBlock}>
                <Text style={styles.brand}>PoolPicks</Text>
                <Text style={styles.tagline}>Golf pools with your friends</Text>
              </View>

              {appleAvailable && (
                <View style={styles.appleBlock}>
                  <View style={styles.appleBtnWrapper}>
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
                      <View
                        style={styles.appleSpinnerOverlay}
                        pointerEvents="none"
                      >
                        <Spinner size={20} color="#ffffff" />
                      </View>
                    )}
                  </View>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>
                </View>
              )}

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
                    <Text style={styles.primaryBtnText}>Email Sign-In Code</Text>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.otpCard}>
              <Text style={styles.otpHeading}>Enter Your Code</Text>
              <Text style={styles.otpSubtitle}>
                We sent a 6-digit code to{" "}
                <Text style={styles.otpEmail}>{email}</Text>
              </Text>

              <View style={styles.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    style={styles.otpBox}
                    value={digit}
                    onChangeText={(text) => updateOtp(i, text)}
                    onKeyPress={(e) => handleOtpKey(i, e)}
                    keyboardType="number-pad"
                    maxLength={OTP_LENGTH}
                    textContentType={i === 0 ? "oneTimeCode" : "none"}
                    autoComplete={i === 0 ? "sms-otp" : "off"}
                    selectTextOnFocus
                    editable={!submitting}
                  />
                ))}
              </View>

              <Pressable
                style={[
                  styles.primaryBtn,
                  styles.verifyBtn,
                  (submitting || otpString.length !== OTP_LENGTH) &&
                    styles.btnDisabled,
                ]}
                onPress={verifyCode}
                disabled={submitting || otpString.length !== OTP_LENGTH}
              >
                {submitting ? (
                  <View style={styles.verifyContent}>
                    <Spinner size={18} color={Colors.light.card} />
                    <Text style={styles.primaryBtnText}>Verifying…</Text>
                  </View>
                ) : (
                  <Text style={styles.primaryBtnText}>Verify Code</Text>
                )}
              </Pressable>

              <Pressable
                style={styles.linkBtn}
                onPress={resendCode}
                disabled={resendCooldown > 0}
              >
                <Text
                  style={[
                    styles.linkBtnSubtle,
                    resendCooldown > 0 && styles.linkBtnDisabled,
                  ]}
                >
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Resend code"}
                </Text>
              </Pressable>

              <Pressable
                style={styles.linkBtn}
                onPress={() => {
                  setOtp(Array(OTP_LENGTH).fill(""));
                  setStep("email");
                }}
                disabled={submitting}
              >
                <Text style={styles.linkBtnSubtle}>Use a different email</Text>
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
  primaryBtn: {
    marginTop: 8,
    backgroundColor: Colors.light.tint,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryBtnText: { color: Colors.light.card, fontSize: 16, fontWeight: "600" },
  btnDisabled: { opacity: 0.5 },
  linkBtn: { paddingVertical: 10, alignItems: "center" },
  linkBtnSubtle: {
    color: Colors.light.muted,
    fontSize: 13,
    textDecorationLine: "underline",
  },
  linkBtnDisabled: { textDecorationLine: "none", opacity: 0.6 },
  appleBlock: { marginBottom: 8 },
  appleBtnWrapper: { position: "relative" },
  appleBtn: { width: "100%", height: 48 },
  appleSpinnerOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 16,
    alignItems: "flex-end",
    justifyContent: "center",
  },
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
  otpCard: {
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 28,
    alignItems: "center",
  },
  otpHeading: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
    textAlign: "center",
  },
  otpSubtitle: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.light.muted,
    textAlign: "center",
  },
  otpEmail: { color: Colors.light.text, fontWeight: "700" },
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    width: "100%",
  },
  otpBox: {
    width: 44,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    color: Colors.light.text,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  verifyBtn: { width: "100%", marginTop: 16 },
  verifyContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
