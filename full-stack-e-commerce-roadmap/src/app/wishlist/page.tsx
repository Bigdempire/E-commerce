"use client";

import { useCart } from "@/components/cart-provider";
import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  price: string;
  imageUrl: string;
  description: string;
};

export default function WishlistPage() {
  const { addToCart } = useCart();
  const [items, setItems] = useState<Product[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/wishlist", { cache: "no-store" });
    if (!response.ok) {
      setError("Please login to view wishlist.");
      return;
    }

    const data = (await response.json()) as { items: Product[] };
    setItems(data.items ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function remove(productId: number) {
    await fetch(`/api/wishlist?productId=${productId}`, { method: "DELETE" });
    setItems((prev) => prev.filter((item) => item.id !== productId));
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">Wishlist</h1>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((product) => (
          <article key={product.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <img src={product.imageUrl} alt={product.name} className="h-40 w-full rounded object-cover" />
            <h2 className="mt-3 font-semibold">{product.name}</h2>
            <p className="mt-1 text-sm text-slate-600">{product.description}</p>
            <p className="mt-2 font-semibold">${Number(product.price).toFixed(2)}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => addToCart(product.id)} className="rounded bg-slate-900 px-3 py-2 text-sm text-white">
                Add to cart
              </button>
              <button onClick={() => remove(product.id)} className="rounded border border-slate-300 px-3 py-2 text-sm">
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
