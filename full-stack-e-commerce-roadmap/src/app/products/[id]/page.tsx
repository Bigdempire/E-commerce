"use client";

import { useCart } from "@/components/cart-provider";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  rating: string;
  reviewCount: number;
};

type Review = {
  id: number;
  rating: number;
  comment: string;
  userName: string;
  createdAt: string;
};

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  async function load() {
    const [productRes, reviewRes] = await Promise.all([
      fetch(`/api/products/${id}`, { cache: "no-store" }),
      fetch(`/api/products/${id}/reviews`, { cache: "no-store" }),
    ]);

    if (productRes.ok) {
      const productData = (await productRes.json()) as { product: Product };
      setProduct(productData.product);
    }

    if (reviewRes.ok) {
      const reviewData = (await reviewRes.json()) as { reviews: Review[] };
      setReviews(reviewData.reviews ?? []);
    }
  }

  useEffect(() => {
    if (!id) return;
    void load();
  }, [id]);

  async function submitReview(event: React.FormEvent) {
    event.preventDefault();

    const response = await fetch(`/api/products/${id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment }),
    });

    if (response.ok) {
      setComment("");
      await load();
    }
  }

  if (!product) {
    return <main className="mx-auto max-w-5xl px-4 py-8">Loading product...</main>;
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <section className="grid gap-6 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2">
        <img src={product.imageUrl} alt={product.name} className="h-80 w-full rounded object-cover" />
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="mt-2 text-slate-700">{product.description}</p>
          <p className="mt-3 text-amber-600">
            ★ {Number(product.rating).toFixed(1)} ({product.reviewCount} reviews)
          </p>
          <p className="mt-3 text-2xl font-bold">${Number(product.price).toFixed(2)}</p>
          <button onClick={() => addToCart(product.id)} className="mt-4 rounded bg-slate-900 px-4 py-2 text-white">
            Add to cart
          </button>
        </div>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <form onSubmit={submitReview} className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Write a review</h2>
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="mt-3 w-full rounded border border-slate-300 px-3 py-2">
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} star{value > 1 ? "s" : ""}
              </option>
            ))}
          </select>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} required minLength={2} className="mt-3 h-28 w-full rounded border border-slate-300 px-3 py-2" placeholder="Share your thoughts" />
          <button className="mt-3 rounded bg-slate-900 px-4 py-2 text-white">Submit review</button>
        </form>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Customer reviews</h2>
          <div className="mt-3 space-y-3">
            {reviews.map((review) => (
              <article key={review.id} className="rounded border border-slate-200 p-3">
                <p className="text-sm font-medium">{review.userName}</p>
                <p className="text-sm text-amber-600">{Array(review.rating).fill("★").join("")}</p>
                <p className="mt-1 text-sm text-slate-700">{review.comment}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
