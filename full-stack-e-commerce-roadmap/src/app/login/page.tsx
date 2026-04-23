"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Login failed");
      return;
    }

    window.location.href = "/";
  }

  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-md items-center px-4 py-8">
      <form onSubmit={handleSubmit} className="w-full rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="mt-1 text-sm text-slate-600">Use admin@example.com / admin12345 for admin demo.</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="mt-4 w-full rounded border border-slate-300 px-3 py-2"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="mt-3 w-full rounded border border-slate-300 px-3 py-2"
          required
          minLength={8}
        />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button className="mt-4 w-full rounded bg-slate-900 px-4 py-2 text-white">Login</button>
        <p className="mt-4 text-sm text-slate-600">
          No account? <Link className="text-slate-900 underline" href="/signup">Create one</Link>
        </p>
      </form>
    </main>
  );
}
