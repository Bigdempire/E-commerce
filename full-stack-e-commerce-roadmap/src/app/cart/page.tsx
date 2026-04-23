"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { useEffect, useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  price: string;
  imageUrl: string;
  stock: number;
};

export default function CartPage() {
  const { items, setQuantity, removeFromCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function load() {
      const [productRes, meRes] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }),
        fetch("/api/auth/me", { cache: "no-store" }),
      ]);
      const productData = (await productRes.json()) as { products: Product[] };
      const meData = (await meRes.json()) as { user: { id: number } | null };

      setProducts(productData.products ?? []);
      setIsLoggedIn(Boolean(meData.user));
    }

    void load();
  }, []);

  const lines = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, p]));
    return items
      .map((item) => ({ item, product: map.get(item.productId) }))
      .filter((line) => Boolean(line.product));
  }, [items, products]);

  const total = lines.reduce((sum, line) => sum + Number(line.product!.price) * line.item.quantity, 0);

  async function syncToServer() {
    if (!isLoggedIn) return;
    await fetch("/api/cart", { method: "DELETE" });
    await Promise.all(
      items.map((line) =>
        fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: line.productId, quantity: line.quantity }),
        }),
      ),
    );
  }

  useEffect(() => {
    if (items.length && isLoggedIn) {
      void syncToServer();
    }
  }, [isLoggedIn]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">Shopping Cart</h1>

      {lines.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <p>Your cart is empty.</p>
          <Link href="/" className="mt-3 inline-block text-slate-900 underline">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {lines.map((line) => (
            <article key={line.item.productId} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
              <img src={line.product!.imageUrl} alt={line.product!.name} className="h-20 w-20 rounded object-cover" />
              <div className="flex-1">
                <h2 className="font-semibold">{line.product!.name}</h2>
                <p className="text-sm text-slate-600">${Number(line.product!.price).toFixed(2)}</p>
              </div>
              <input
                type="number"
                min={1}
                max={line.product!.stock}
                value={line.item.quantity}
                onChange={(e) => setQuantity(line.item.productId, Number(e.target.value))}
                className="w-20 rounded border border-slate-300 px-2 py-1"
              />
              <button
                onClick={() => removeFromCart(line.item.productId)}
                className="rounded border border-slate-300 px-3 py-1 text-sm"
              >
                Remove
              </button>
            </article>
          ))}

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-lg font-semibold">Total: ${total.toFixed(2)}</p>
            <Link href="/checkout" className="mt-3 inline-block rounded bg-slate-900 px-4 py-2 text-white">
              Proceed to checkout
            </Link>
          </section>
        </div>
      )}
    </main>
  );
}
