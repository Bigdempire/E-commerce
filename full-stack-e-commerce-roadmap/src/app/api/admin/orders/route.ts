import { db } from "@/db";
import { orderItems, orders, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  const userIds = [...new Set(rows.map((row) => row.userId))];
  const orderIds = rows.map((row) => row.id);

  const userRows = userIds.length
    ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, userIds))
    : [];
  const itemRows = orderIds.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds)) : [];

  const userMap = new Map(userRows.map((u) => [u.id, u]));

  return NextResponse.json({
    orders: rows.map((order) => ({
      ...order,
      user: userMap.get(order.userId) ?? null,
      items: itemRows.filter((item) => item.orderId === order.id),
    })),
  });
}
