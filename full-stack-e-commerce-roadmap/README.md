# SwiftCart (Next.js + PostgreSQL + Drizzle)

Fullstack e-commerce starter with:
- JWT auth (signup/login/logout)
- Product catalog with search and filters
- Cart persistence in localStorage + optional DB sync
- Stripe checkout integration (demo fallback when Stripe key is missing)
- Order history and tracking
- Admin dashboard for products, orders, and sales reporting
- Ratings/reviews and wishlist

## Local Setup

1. Install deps
```bash
npm install
```

2. Configure `.env`
```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
JWT_SECRET=replace-with-a-strong-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=
```

3. Push schema
```bash
npx drizzle-kit push
```

4. Run app
```bash
npm run dev
```

## Demo Accounts

Admin user is auto-seeded on first product request:
- `admin@example.com`
- `admin12345`

## Deployment

### Vercel (Recommended for Next.js fullstack)
- Import this repo into Vercel
- Set environment variables in Project Settings
- Point `DATABASE_URL` to managed PostgreSQL (Neon, Supabase, RDS, etc.)
- Set `NEXT_PUBLIC_APP_URL` to your production URL

### Database
- Use cloud PostgreSQL (Neon/Supabase/RDS)
- Run `npx drizzle-kit push` against production DB URL

### Stripe
- Add `STRIPE_SECRET_KEY`
- Use Stripe Dashboard for production keys and webhook setup (optional enhancement)
