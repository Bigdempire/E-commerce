import { db } from "@/db";
import { products } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { createOrder } from "@/lib/orders";
import { inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

const schema = z.object({
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

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = schema.parse(await request.json());

    const ids = body.items.map((item) => item.productId);
    const productRows = await db.select().from(products).where(inArray(products.id, ids));
    const productMap = new Map(productRows.map((p) => [p.id, p]));

    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
      const order = await createOrder({
        userId: session.userId,
        items: body.items,
        shipping: body.shipping,
        paymentProvider: "demo",
        paymentReference: `demo_${Date.now()}`,
        initialStatus: "paid",
      });

      return NextResponse.json({
        mode: "demo",
        redirectUrl: `/checkout/success?orderId=${order.id}`,
      });
    }

    const stripe = new Stripe(stripeKey);

    const lineItems = body.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error("Invalid product");
      }

      return {
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(Number(product.price) * 100),
          product_data: {
            name: product.name,
            description: product.description,
            images: [product.imageUrl],
          },
        },
      };
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout`,
      line_items: lineItems,
      metadata: {
        userId: String(session.userId),
        shipping: JSON.stringify(body.shipping),
        items: JSON.stringify(body.items),
      },
    });

    return NextResponse.json({ mode: "stripe", url: checkoutSession.url });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Checkout failed" }, { status: 400 });
  }
}
