import { db } from "@/db";
import { products, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { count } from "drizzle-orm";

export async function ensureSeedData() {
  const [{ value: userCount }] = await db.select({ value: count() }).from(users);

  if (userCount === 0) {
    const passwordHash = await hashPassword("admin12345");
    await db.insert(users).values({
      name: "Admin User",
      email: "admin@example.com",
      passwordHash,
      role: "admin",
    });
  }

  const [{ value: productCount }] = await db.select({ value: count() }).from(products);

  if (productCount === 0) {
    await db.insert(products).values([
      {
        name: "Urban Runner Sneakers",
        description: "Lightweight everyday sneakers with breathable mesh upper.",
        category: "Footwear",
        price: "79.99",
        stock: 50,
        imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200",
      },
      {
        name: "Classic Denim Jacket",
        description: "Timeless denim jacket perfect for layered outfits.",
        category: "Apparel",
        price: "59.00",
        stock: 30,
        imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200",
      },
      {
        name: "Wireless Noise-Canceling Headphones",
        description: "Immersive sound with active noise cancellation and long battery life.",
        category: "Electronics",
        price: "149.50",
        stock: 20,
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200",
      },
      {
        name: "Minimalist Backpack",
        description: "Durable backpack with laptop compartment and water-resistant shell.",
        category: "Accessories",
        price: "64.25",
        stock: 40,
        imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200",
      },
      {
        name: "Smart Fitness Watch",
        description: "Track workouts, heart rate, and sleep with a sleek AMOLED display.",
        category: "Electronics",
        price: "129.99",
        stock: 25,
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200",
      },
    ]);
  }
}

export function toNumber(value: string | number) {
  return typeof value === "number" ? value : Number(value);
}

export function formatCurrency(value: string | number) {
  const numeric = toNumber(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numeric);
}
