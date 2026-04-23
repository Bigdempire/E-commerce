import { db } from "@/db";
import { products, wishlists } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  productId: z.coerce.number().int().positive(),
});

export async function GET() {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ items: [] });

  const items = await db.query.wishlists.findMany({ where: eq(wishlists.userId, session.userId) });
  const ids = items.map((item) => item.productId);
  const productsList = ids.length
    ? await db.select().from(products).where(inArray(products.id, ids))
    : [];

  return NextResponse.json({ items: productsList });
}

export async function POST(request: Request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = schema.parse(await request.json());

    const existing = await db.query.wishlists.findFirst({
      where: and(eq(wishlists.userId, session.userId), eq(wishlists.productId, body.productId)),
    });

    if (!existing) {
      await db.insert(wishlists).values({
        userId: session.userId,
        productId: body.productId,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const productId = Number(url.searchParams.get("productId"));

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  await db
    .delete(wishlists)
    .where(and(eq(wishlists.userId, session.userId), eq(wishlists.productId, productId)));

  return NextResponse.json({ ok: true });
}
