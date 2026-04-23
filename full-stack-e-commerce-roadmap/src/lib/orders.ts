import { db } from "@/db";
import { cartItems, orderItems, orders, products } from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

type CheckoutItem = {
  productId: number;
  quantity: number;
};

type ShippingDetails = {
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
};

export async function createOrder(args: {
  userId: number;
  items: CheckoutItem[];
  shipping: ShippingDetails;
  paymentProvider: "stripe" | "demo";
  paymentReference?: string;
  initialStatus?: string;
}) {
  const uniqueItems = new Map<number, number>();

  for (const item of args.items) {
    if (item.quantity < 1) continue;
    uniqueItems.set(item.productId, (uniqueItems.get(item.productId) ?? 0) + item.quantity);
  }

  const itemEntries = Array.from(uniqueItems.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));

  if (!itemEntries.length) {
    throw new Error("Cart is empty");
  }

  const ids = itemEntries.map((entry) => entry.productId);
  const productRows = await db.select().from(products).where(inArray(products.id, ids));
  const productMap = new Map(productRows.map((p) => [p.id, p]));

  let total = 0;

  for (const item of itemEntries) {
    const product = productMap.get(item.productId);
    if (!product) throw new Error("Invalid product in cart");
    if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);
    total += Number(product.price) * item.quantity;
  }

  const result = await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        userId: args.userId,
        totalAmount: total.toFixed(2),
        status: args.initialStatus ?? "paid",
        shippingName: args.shipping.shippingName,
        shippingAddress: args.shipping.shippingAddress,
        shippingCity: args.shipping.shippingCity,
        shippingPostalCode: args.shipping.shippingPostalCode,
        shippingCountry: args.shipping.shippingCountry,
        paymentProvider: args.paymentProvider,
        paymentReference: args.paymentReference,
      })
      .returning();

    for (const item of itemEntries) {
      const product = productMap.get(item.productId)!;
      await tx.insert(orderItems).values({
        orderId: order.id,
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
      });

      await tx
        .update(products)
        .set({ stock: sql`${products.stock} - ${item.quantity}` })
        .where(and(eq(products.id, product.id), sql`${products.stock} >= ${item.quantity}`));
    }

    await tx.delete(cartItems).where(eq(cartItems.userId, args.userId));

    return order;
  });

  return result;
}
