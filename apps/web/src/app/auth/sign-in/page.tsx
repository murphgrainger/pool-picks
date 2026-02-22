"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/Spinner";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const supabase = createClient();

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

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setEmailSent(true);
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="container mx-auto max-w-5xl flex flex-wrap items-center flex-col p-4">
        <div className="bg-grey-50 w-full max-w-md p-10 rounded flex flex-col items-center text-center">
          <h1>Check Your Email</h1>
          <p className="mt-6">
            We sent you a verification link so you can sign into PoolPicks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl flex flex-wrap items-center flex-col">
      <div className="bg-grey-50 w-full max-w-md p-10 rounded flex flex-col items-center">
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
          onSubmit={handleEmailSignIn}
          className="flex flex-col mt-6 w-full"
        >
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Email"
            className="w-full rounded h-14"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            className="mt-4 bg-grey-200 text-white hover:bg-black rounded"
            disabled={loading || !email}
          >
            {loading ? "Sending you an email..." : "Continue with Email"}
          </button>
          {error && <p className="mt-2 text-yellow">{error}</p>}
        </form>
      </div>
    </div>
  );
}
