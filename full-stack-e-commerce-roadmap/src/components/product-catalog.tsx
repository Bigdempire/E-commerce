"use client";

import { useCart } from "@/components/cart-provider";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  description: string;
  category: string;
  price: string;
  stock: number;
  imageUrl: string;
  rating: string;
  reviewCount: number;
};

export function ProductCatalog() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [wishlist, setWishlist] = useState<number[]>([]);

  async function fetchProducts() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category && category !== "All") params.set("category", category);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);

    const response = await fetch(`/api/products?${params.toString()}`, { cache: "no-store" });
    const data = (await response.json()) as { products: Product[] };
    setProducts(data.products ?? []);
  }

  async function fetchWishlist() {
    const response = await fetch("/api/wishlist", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { items: Product[] };
    setWishlist(data.items.map((item) => item.id));
  }

  useEffect(() => {
    void fetchProducts();
  }, []);

  useEffect(() => {
    void fetchWishlist();
  }, []);

  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(products.map((product) => product.category)))];
  }, [products]);

  async function applyFilters(event: React.FormEvent) {
    event.preventDefault();
    await fetchProducts();
  }

  async function toggleWishlist(productId: number) {
    const exists = wishlist.includes(productId);

    if (exists) {
      await fetch(`/api/wishlist?productId=${productId}`, { method: "DELETE" });
      setWishlist((prev) => prev.filter((id) => id !== productId));
      return;
    }

    const response = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });

    if (response.ok) {
      setWishlist((prev) => [...prev, productId]);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <section className="mb-6 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Discover Products</h1>
        <p className="mt-1 text-sm text-slate-600">Search, filter, and add items to your cart.</p>

        <form onSubmit={applyFilters} className="mt-4 grid gap-3 sm:grid-cols-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products"
            className="rounded border border-slate-300 px-3 py-2"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2"
          >
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min price"
            type="number"
            className="rounded border border-slate-300 px-3 py-2"
          />
          <input
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max price"
            type="number"
            className="rounded border border-slate-300 px-3 py-2"
          />
          <button className="rounded bg-slate-900 px-4 py-2 text-white sm:col-span-4">Apply Filters</button>
        </form>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <article key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <img src={product.imageUrl} alt={product.name} className="h-44 w-full object-cover" />
            <div className="p-4">
              <h2 className="line-clamp-1 font-semibold">{product.name}</h2>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{product.category}</p>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{product.description}</p>
              <p className="mt-2 text-sm text-amber-600">
                ★ {Number(product.rating).toFixed(1)} ({product.reviewCount})
              </p>
              <p className="mt-3 text-lg font-bold">${Number(product.price).toFixed(2)}</p>
              <p className="mt-1 text-xs text-slate-500">Stock: {product.stock}</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => addToCart(product.id, 1)}
                  disabled={product.stock < 1}
                  className="flex-1 rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  Add to cart
                </button>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="rounded border border-slate-300 px-3 py-2 text-sm"
                >
                  {wishlist.includes(product.id) ? "♥" : "♡"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
