"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/Spinner";
import { useRouter } from "next/navigation";

type AuthStep = "email" | "otp";

export default function SignInPage() {
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const supabase = createClient();
  const router = useRouter();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === "otp") {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  const otpString = otp.join("");

  const updateOtp = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || "";
    }
    setOtp(next);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setStep("otp");
    setResendCooldown(60);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otpString,
      type: "email",
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    if (data.user) {
      await fetch("/api/auth/ensure-user", { method: "POST" });
    }

    router.push("/");
    router.refresh();
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (error) {
      setError(error.message);
      return;
    }

    setResendCooldown(60);
  };

  if (step === "otp") {
    return (
      <div className="container mx-auto max-w-5xl flex flex-wrap items-center flex-col p-4">
        <div className="bg-white border border-grey-100 shadow-sm w-full max-w-md p-10 rounded-lg flex flex-col items-center text-center">
          <h1>Enter Your Code</h1>
          <p className="mt-4 text-grey-75">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>
          <form
            onSubmit={handleVerifyOtp}
            className="flex flex-col mt-6 w-full"
          >
            <div className="flex gap-2 w-full justify-center">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  className="w-12 h-14 rounded border border-grey-300 text-center text-2xl font-mono focus:border-green-700 focus:ring-1 focus:ring-green-700 outline-none"
                  value={digit}
                  onChange={(e) => updateOtp(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onPaste={handleOtpPaste}
                />
              ))}
            </div>
            <button
              type="submit"
              className="mt-4 bg-green-700 text-white hover:bg-green-900 rounded"
              disabled={loading || otpString.length !== 6}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Spinner className="w-6 h-6 mr-1" /> Verifying...
                </span>
              ) : (
                "Verify Code"
              )}
            </button>
            {error && <p className="mt-2 text-red-500">{error}</p>}
          </form>
          <button
            onClick={handleResendOtp}
            disabled={resendCooldown > 0}
            className="mt-4 text-sm text-grey-75 underline disabled:no-underline disabled:text-grey-50"
          >
            {resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : "Resend code"}
          </button>
          <button
            onClick={() => {
              setStep("email");
              setOtp(["", "", "", "", "", ""]);
              setError("");
            }}
            className="mt-2 text-sm text-grey-75 underline"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl flex flex-wrap items-center flex-col">
      <div className="bg-white border border-grey-100 shadow-sm w-full max-w-md p-10 rounded-lg flex flex-col items-center">
        <h1 className="mb-8">Sign In</h1>
        <button
          onClick={handleGoogleSignIn}
          className="w-full mb-8 button-oauth rounded hover:bg-gray-100 active:bg-gray-100 h-14"
          disabled={googleLoading}
        >
          {googleLoading ? (
            <span className="flex items-center justify-center">
              <Spinner className="w-6 h-6 mr-1" />
              Signing In...
            </span>
          ) : (
            <span className="flex items-center">
              <img
                src="/google_logo.svg"
                alt="Google Icon"
                className="oauth-logo"
              />
              Continue with Google
            </span>
          )}
        </button>
        <hr className="mt-4 mb-4" />
        <form
          onSubmit={handleSendOtp}
          className="flex flex-col mt-6 w-full"
        >
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Email"
            className="w-full rounded h-14 border border-grey-300"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            className="mt-4 bg-green-700 text-white hover:bg-green-900 rounded"
            disabled={loading || !email}
          >
            {loading ? "Sending code..." : "Email Sign-In Code"}
          </button>
          {error && <p className="mt-2 text-red-500">{error}</p>}
        </form>
      </div>
    </div>
  );
}
