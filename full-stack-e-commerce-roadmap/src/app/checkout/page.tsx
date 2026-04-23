"use client";

import { useCart } from "@/components/cart-provider";
import { useEffect, useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  price: string;
};

export default function CheckoutPage() {
  const { items } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [shippingName, setShippingName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [shippingCountry, setShippingCountry] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/products", { cache: "no-store" });
      const data = (await response.json()) as { products: Product[] };
      setProducts(data.products ?? []);
    }
    void load();
  }, []);

  const lines = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, p]));
    return items
      .map((item) => ({ item, product: map.get(item.productId) }))
      .filter((line) => Boolean(line.product));
  }, [products, items]);

  const total = lines.reduce((sum, line) => sum + Number(line.product!.price) * line.item.quantity, 0);

  async function handleCheckout(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const response = await fetch("/api/checkout/create-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        shipping: {
          shippingName,
          shippingAddress,
          shippingCity,
          shippingPostalCode,
          shippingCountry,
        },
      }),
    });

    const data = (await response.json()) as { error?: string; url?: string; redirectUrl?: string };

    if (!response.ok) {
      setError(data.error ?? "Checkout failed");
      return;
    }

    if (data.url) {
      window.location.href = data.url;
      return;
    }

    if (data.redirectUrl) {
      window.location.href = data.redirectUrl;
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleCheckout} className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Shipping details</h2>
          <input value={shippingName} onChange={(e) => setShippingName(e.target.value)} placeholder="Full name" required className="mt-3 w-full rounded border border-slate-300 px-3 py-2" />
          <input value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="Address" required className="mt-3 w-full rounded border border-slate-300 px-3 py-2" />
          <input value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} placeholder="City" required className="mt-3 w-full rounded border border-slate-300 px-3 py-2" />
          <input value={shippingPostalCode} onChange={(e) => setShippingPostalCode(e.target.value)} placeholder="Postal code" required className="mt-3 w-full rounded border border-slate-300 px-3 py-2" />
          <input value={shippingCountry} onChange={(e) => setShippingCountry(e.target.value)} placeholder="Country" required className="mt-3 w-full rounded border border-slate-300 px-3 py-2" />
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button className="mt-4 w-full rounded bg-slate-900 px-4 py-2 text-white">Pay securely</button>
        </form>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <div className="mt-3 space-y-2 text-sm">
            {lines.map((line) => (
              <div key={line.item.productId} className="flex items-center justify-between">
                <span>
                  {line.product!.name} × {line.item.quantity}
                </span>
                <span>${(Number(line.product!.price) * line.item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-slate-200 pt-3 text-lg font-semibold">Total: ${total.toFixed(2)}</p>
          <p className="mt-2 text-xs text-slate-500">Uses Stripe when configured; otherwise uses demo payment mode.</p>
        </section>
      </div>
    </main>
  );
}
