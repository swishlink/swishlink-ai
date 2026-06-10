"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;
    if (user) {
      await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email || email,
        username: null,
      });
    }

    setLoading(false);
    setDone(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSignup();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <nav className="px-8 py-5 border-b border-white/5">
        <Link href="/" className="text-lg font-bold tracking-tight">SwishLink</Link>
      </nav>

      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          {done ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-500/10 mb-4">
                <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Check your email</h2>
              <p className="text-sm text-gray-500">
                We sent a confirmation link to <span className="text-gray-300">{email}</span>.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-1">Create your account</h1>
              <p className="text-sm text-gray-500 mb-8">Start analyzing your game today.</p>

              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-colors"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-colors"
                />
              </div>

              {error && (
                <p className="mt-3 text-sm text-red-400">{error}</p>
              )}

              <button
                onClick={handleSignup}
                disabled={loading}
                className="mt-5 w-full rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                {loading ? "Creating account…" : "Create Account"}
              </button>

              <p className="mt-5 text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-gray-400 hover:text-white underline underline-offset-2">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
