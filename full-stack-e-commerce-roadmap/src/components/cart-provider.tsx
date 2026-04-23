"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

type CartLine = {
  productId: number;
  quantity: number;
};

type CartContextValue = {
  items: CartLine[];
  count: number;
  addToCart: (productId: number, quantity?: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "shop-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as CartLine[];
      setItems(parsed.filter((item) => item.quantity > 0));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    return {
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      addToCart(productId, quantity = 1) {
        setItems((prev) => {
          const existing = prev.find((line) => line.productId === productId);
          if (!existing) return [...prev, { productId, quantity }];
          return prev.map((line) =>
            line.productId === productId ? { ...line, quantity: line.quantity + quantity } : line,
          );
        });
      },
      setQuantity(productId, quantity) {
        if (quantity <= 0) {
          setItems((prev) => prev.filter((line) => line.productId !== productId));
          return;
        }
        setItems((prev) =>
          prev.map((line) => (line.productId === productId ? { ...line, quantity } : line)),
        );
      },
      removeFromCart(productId) {
        setItems((prev) => prev.filter((line) => line.productId !== productId));
      },
      clearCart() {
        setItems([]);
      },
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
