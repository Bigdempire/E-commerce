import { db } from "@/db";
import { products, reviews, users } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { and, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(2),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);

  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      userName: users.name,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.userId))
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt));

  return NextResponse.json({ reviews: rows });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = schema.parse(await request.json());
    const { id } = await params;
    const productId = Number(id);

    const existing = await db.query.reviews.findFirst({
      where: and(eq(reviews.userId, session.userId), eq(reviews.productId, productId)),
    });

    if (existing) {
      await db
        .update(reviews)
        .set({ rating: body.rating, comment: body.comment })
        .where(eq(reviews.id, existing.id));
    } else {
      await db.insert(reviews).values({
        userId: session.userId,
        productId,
        rating: body.rating,
        comment: body.comment,
      });
    }

    const [aggregate] = await db
      .select({
        average: sql<string>`coalesce(avg(${reviews.rating}), 0)::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(reviews)
      .where(eq(reviews.productId, productId));

    await db
      .update(products)
      .set({
        rating: Number(aggregate.average).toFixed(1),
        reviewCount: aggregate.count,
      })
      .where(eq(products.id, productId));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
