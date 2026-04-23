"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function CheckoutSuccessClient() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const orderId = params.get("orderId");
  const { clearCart } = useCart();
  const [message, setMessage] = useState("Finalizing your order...");

  useEffect(() => {
    async function confirm() {
      if (orderId) {
        clearCart();
        setMessage(`Order #${orderId} confirmed.`);
        return;
      }

      if (!sessionId) {
        setMessage("Missing payment reference.");
        return;
      }

      const response = await fetch(`/api/checkout/confirm?session_id=${sessionId}`, { cache: "no-store" });
      const data = (await response.json()) as { order?: { id: number }; error?: string };

      if (!response.ok) {
        setMessage(data.error ?? "Could not confirm payment.");
        return;
      }

      clearCart();
      setMessage(`Payment successful. Order #${data.order?.id ?? ""} created.`);
    }

    void confirm();
  }, [sessionId, orderId, clearCart]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center px-4 py-8">
      <section className="w-full rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold">Checkout Complete</h1>
        <p className="mt-3 text-slate-700">{message}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/orders" className="rounded bg-slate-900 px-4 py-2 text-white">
            View orders
          </Link>
          <Link href="/" className="rounded border border-slate-300 px-4 py-2">
            Continue shopping
          </Link>
        </div>
      </section>
    </main>
  );
}
