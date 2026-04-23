import { db } from "@/db";
import { orders } from "@/db/schema";
import { createOrder } from "@/lib/orders";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session id" }, { status: 400 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 400 });
  }

  const stripe = new Stripe(stripeKey);
  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

  if (checkoutSession.payment_status !== "paid") {
    return NextResponse.json({ error: "Payment not complete" }, { status: 400 });
  }

  const existing = await db.query.orders.findFirst({
    where: and(eq(orders.paymentReference, sessionId), eq(orders.paymentProvider, "stripe")),
  });

  if (existing) {
    return NextResponse.json({ order: existing });
  }

  const metadata = checkoutSession.metadata ?? {};
  const userId = Number(metadata.userId);
  const items = JSON.parse(metadata.items || "[]") as { productId: number; quantity: number }[];
  const shipping = JSON.parse(metadata.shipping || "{}") as {
    shippingName: string;
    shippingAddress: string;
    shippingCity: string;
    shippingPostalCode: string;
    shippingCountry: string;
  };

  if (!userId || !items.length) {
    return NextResponse.json({ error: "Missing checkout metadata" }, { status: 400 });
  }

  const order = await createOrder({
    userId,
    items,
    shipping,
    paymentProvider: "stripe",
    paymentReference: sessionId,
    initialStatus: "paid",
  });

  return NextResponse.json({ order });
}
