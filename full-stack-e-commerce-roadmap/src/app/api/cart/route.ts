import { db } from "@/db";
import { cartItems, products } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const itemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1),
});

const updateSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(0),
});

export async function GET() {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ items: [] });

  const items = await db.query.cartItems.findMany({ where: eq(cartItems.userId, session.userId) });
  const ids = items.map((i) => i.productId);
  const productRows = ids.length
    ? await db.select().from(products).where(inArray(products.id, ids))
    : [];
  const productMap = new Map(productRows.map((p) => [p.id, p]));

  return NextResponse.json({
    items: items.map((item) => ({
      ...item,
      product: productMap.get(item.productId) ?? null,
    })),
  });
}

export async function POST(request: Request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = itemSchema.parse(await request.json());

    const existing = await db.query.cartItems.findFirst({
      where: and(eq(cartItems.userId, session.userId), eq(cartItems.productId, body.productId)),
    });

    if (existing) {
      await db
        .update(cartItems)
        .set({ quantity: existing.quantity + body.quantity })
        .where(eq(cartItems.id, existing.id));
    } else {
      await db.insert(cartItems).values({
        userId: session.userId,
        productId: body.productId,
        quantity: body.quantity,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = updateSchema.parse(await request.json());

    if (body.quantity === 0) {
      await db
        .delete(cartItems)
        .where(and(eq(cartItems.userId, session.userId), eq(cartItems.productId, body.productId)));
      return NextResponse.json({ ok: true });
    }

    await db
      .update(cartItems)
      .set({ quantity: body.quantity })
      .where(and(eq(cartItems.userId, session.userId), eq(cartItems.productId, body.productId)));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");

  if (productId) {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.userId, session.userId), eq(cartItems.productId, Number(productId))));
  } else {
    await db.delete(cartItems).where(eq(cartItems.userId, session.userId));
  }

  return NextResponse.json({ ok: true });
}
