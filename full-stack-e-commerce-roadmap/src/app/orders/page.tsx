"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  id: number;
  productName: string;
  unitPrice: string;
  quantity: number;
};

type Order = {
  id: number;
  status: string;
  totalAmount: string;
  createdAt: string;
  items: OrderItem[];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      const response = await fetch("/api/orders", { cache: "no-store" });
      if (!response.ok) {
        setError("Please login to view order history.");
        return;
      }
      const data = (await response.json()) as { orders: Order[] };
      setOrders(data.orders ?? []);
    }

    void loadOrders();
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">Order History</h1>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 space-y-4">
        {orders.map((order) => (
          <section key={order.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold">Order #{order.id}</h2>
              <p className="text-sm text-slate-600">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <p className="mt-1 text-sm">
              Status: <span className="font-medium">{order.status}</span>
            </p>
            <p className="mt-1 text-sm font-semibold">Total: ${Number(order.totalAmount).toFixed(2)}</p>
            <ul className="mt-3 list-inside list-disc text-sm text-slate-700">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.productName} × {item.quantity} — ${Number(item.unitPrice).toFixed(2)} each
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
