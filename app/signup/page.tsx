"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    const user = data.user;

    if (user) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email || email,
        username: null,
      });

      if (profileError) {
        alert(profileError.message);
        return;
      }
    }

    alert("Check your email to confirm your account");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-4">Sign Up</h1>

      <input
        type="email"
        placeholder="Email"
        className="border p-2 mb-2 w-64"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="border p-2 mb-4 w-64"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={handleSignup}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Create Account
      </button>
    </main>
  );
}