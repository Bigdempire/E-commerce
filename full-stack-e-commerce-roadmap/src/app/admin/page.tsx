"use client";

import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  category: string;
  price: string;
  stock: number;
  imageUrl: string;
  description: string;
};

type AdminOrder = {
  id: number;
  status: string;
  totalAmount: string;
  createdAt: string;
  user: { name: string; email: string } | null;
};

type Reports = {
  summary: { totalOrders: number; grossRevenue: string };
  topProducts: { productId: number; productName: string; unitsSold: number }[];
  lowStock: { id: number; name: string; stock: number }[];
};

const initialForm = {
  name: "",
  description: "",
  category: "",
  price: "",
  stock: "0",
  imageUrl: "",
};

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [reports, setReports] = useState<Reports | null>(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  async function loadAll() {
    const [productsRes, ordersRes, reportsRes] = await Promise.all([
      fetch("/api/products", { cache: "no-store" }),
      fetch("/api/admin/orders", { cache: "no-store" }),
      fetch("/api/admin/reports", { cache: "no-store" }),
    ]);

    if (!ordersRes.ok || !reportsRes.ok) {
      setError("Admin access required.");
      return;
    }

    const productData = (await productsRes.json()) as { products: Product[] };
    const orderData = (await ordersRes.json()) as { orders: AdminOrder[] };
    const reportData = (await reportsRes.json()) as Reports;

    setProducts(productData.products ?? []);
    setOrders(orderData.orders ?? []);
    setReports(reportData);
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function createProduct(event: React.FormEvent) {
    event.preventDefault();

    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      setError("Failed to create product.");
      return;
    }

    setForm(initialForm);
    await loadAll();
  }

  async function deleteProduct(id: number) {
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    await loadAll();
  }

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/orders/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadAll();
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {reports && (
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">Total Orders</p>
            <p className="mt-1 text-2xl font-bold">{reports.summary.totalOrders}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">Gross Revenue</p>
            <p className="mt-1 text-2xl font-bold">${Number(reports.summary.grossRevenue).toFixed(2)}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">Low-stock items</p>
            <p className="mt-1 text-2xl font-bold">{reports.lowStock.length}</p>
          </div>
        </section>
      )}

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={createProduct} className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Add product</h2>
          <div className="mt-3 grid gap-2">
            <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="Name" className="rounded border border-slate-300 px-3 py-2" required />
            <input value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} placeholder="Category" className="rounded border border-slate-300 px-3 py-2" required />
            <input value={form.price} onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))} placeholder="Price" type="number" step="0.01" className="rounded border border-slate-300 px-3 py-2" required />
            <input value={form.stock} onChange={(e) => setForm((s) => ({ ...s, stock: e.target.value }))} placeholder="Stock" type="number" className="rounded border border-slate-300 px-3 py-2" required />
            <input value={form.imageUrl} onChange={(e) => setForm((s) => ({ ...s, imageUrl: e.target.value }))} placeholder="Image URL" className="rounded border border-slate-300 px-3 py-2" required />
            <textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} placeholder="Description" className="rounded border border-slate-300 px-3 py-2" required />
          </div>
          <button className="mt-3 rounded bg-slate-900 px-4 py-2 text-white">Create Product</button>
        </form>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Top selling products</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {reports?.topProducts.map((item) => (
              <li key={item.productId} className="flex justify-between">
                <span>{item.productName}</span>
                <span>{item.unitsSold} sold</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Manage products</h2>
        <div className="mt-3 space-y-2">
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between rounded border border-slate-200 p-3">
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-xs text-slate-600">
                  {product.category} · ${Number(product.price).toFixed(2)} · stock {product.stock}
                </p>
              </div>
              <button onClick={() => deleteProduct(product.id)} className="rounded border border-slate-300 px-3 py-1 text-sm">
                Delete
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Manage orders</h2>
        <div className="mt-3 space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-slate-200 p-3">
              <div>
                <p className="font-medium">Order #{order.id}</p>
                <p className="text-xs text-slate-600">
                  {order.user?.name ?? "Unknown customer"} · ${Number(order.totalAmount).toFixed(2)}
                </p>
              </div>
              <select
                value={order.status}
                onChange={(e) => updateStatus(order.id, e.target.value)}
                className="rounded border border-slate-300 px-3 py-2 text-sm"
              >
                {[
                  "pending",
                  "paid",
                  "processing",
                  "shipped",
                  "delivered",
                  "cancelled",
                ].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
