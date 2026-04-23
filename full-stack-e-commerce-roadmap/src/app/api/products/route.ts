import { db } from "@/db";
import { products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { ensureSeedData } from "@/lib/store";
import { and, asc, gte, ilike, lte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  category: z.string().min(2),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0),
  imageUrl: z.string().url(),
});

export async function GET(request: NextRequest) {
  await ensureSeedData();

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search")?.trim();
  const category = searchParams.get("category")?.trim();
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  const conditions = [];

  if (search) {
    conditions.push(ilike(products.name, `%${search}%`));
  }

  if (category && category !== "All") {
    conditions.push(ilike(products.category, category));
  }

  if (minPrice) {
    conditions.push(gte(products.price, minPrice));
  }

  if (maxPrice) {
    conditions.push(lte(products.price, maxPrice));
  }

  const list = await db
    .select()
    .from(products)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(products.name));

  return NextResponse.json({ products: list });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = createSchema.parse(await request.json());
    const [created] = await db
      .insert(products)
      .values({ ...body, price: body.price.toFixed(2) })
      .returning();

    return NextResponse.json({ product: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
