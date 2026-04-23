import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { createOrder } from "@/lib/orders";
import { desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  items: z.array(
    z.object({
      productId: z.coerce.number().int().positive(),
      quantity: z.coerce.number().int().positive(),
    }),
  ),
  shipping: z.object({
    shippingName: z.string().min(2),
    shippingAddress: z.string().min(3),
    shippingCity: z.string().min(2),
    shippingPostalCode: z.string().min(2),
    shippingCountry: z.string().min(2),
  }),
});

export async function GET() {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, session.userId))
    .orderBy(desc(orders.createdAt));

  const ids = rows.map((o) => o.id);
  const items = ids.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids)) : [];

  return NextResponse.json({
    orders: rows.map((order) => ({
      ...order,
      items: items.filter((item) => item.orderId === order.id),
    })),
  });
}

export async function POST(request: Request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = createSchema.parse(await request.json());
    const order = await createOrder({
      userId: session.userId,
      items: body.items,
      shipping: body.shipping,
      paymentProvider: "demo",
      initialStatus: "paid",
      paymentReference: `demo_${Date.now()}`,
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Failed to create order" }, { status: 400 });
  }
}
