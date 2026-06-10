"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="min-h-screen bg-[#0d1627] text-white flex flex-col">
      <nav className="px-8 py-5 border-b border-white/5">
        <Link href="/"><Image src="/Swishlink.aiknowyourgamelogover1.png" alt="SwishLink" width={160} height={45} className="object-contain"  /></Link>
      </nav>

      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 mb-8">Log in to your SwishLink account.</p>

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
            onClick={handleLogin}
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            {loading ? "Logging in…" : "Log In"}
          </button>

          <p className="mt-5 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-gray-400 hover:text-white underline underline-offset-2">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
