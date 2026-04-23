"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";

type MeResponse = {
  user: { id: number; name: string; email: string; role: string } | null;
};

export function Navbar() {
  const { count } = useCart();
  const [user, setUser] = useState<MeResponse["user"]>(null);

  async function loadUser() {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    const data = (await res.json()) as MeResponse;
    setUser(data.user);
  }

  useEffect(() => {
    void loadUser();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-bold text-slate-900">
          SwiftCart
        </Link>

        <nav className="flex items-center gap-4 text-sm text-slate-700">
          <Link href="/">Products</Link>
          <Link href="/orders">Orders</Link>
          <Link href="/wishlist">Wishlist</Link>
          {user?.role === "admin" && <Link href="/admin">Admin</Link>}
          <Link href="/cart" className="font-medium">
            Cart ({count})
          </Link>
          {user ? (
            <button onClick={handleLogout} className="rounded bg-slate-900 px-3 py-1.5 text-white">
              Logout
            </button>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/signup" className="rounded bg-slate-900 px-3 py-1.5 text-white">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
