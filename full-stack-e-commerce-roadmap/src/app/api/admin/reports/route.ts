import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [summary] = await db
    .select({
      totalOrders: sql<number>`count(*)::int`,
      grossRevenue: sql<string>`coalesce(sum(${orders.totalAmount}), 0)::text`,
    })
    .from(orders);

  const topProducts = await db
    .select({
      productId: orderItems.productId,
      productName: orderItems.productName,
      unitsSold: sql<number>`sum(${orderItems.quantity})::int`,
    })
    .from(orderItems)
    .groupBy(orderItems.productId, orderItems.productName)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))
    .limit(5);

  const lowStock = await db
    .select({ id: products.id, name: products.name, stock: products.stock })
    .from(products)
    .where(sql`${products.stock} <= 10`)
    .orderBy(eq(products.stock, 0), products.stock);

  return NextResponse.json({ summary, topProducts, lowStock });
}
