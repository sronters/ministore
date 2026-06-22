"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/domain";

export interface LocalCartItem {
  productId: string;
  quantity: number;
  product: Product;
}

interface CartStore {
  items: LocalCartItem[];
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  addProduct: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeProduct: (productId: string) => void;
  clear: () => void;
  mergeServerItems: (items: LocalCartItem[]) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      addProduct: (product, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((item) => item.productId === product.id);
          if (!existing) {
            return { items: [...state.items, { productId: product.id, product, quantity }] };
          }
          return {
            items: state.items.map((item) =>
              item.productId === product.id ? { ...item, product, quantity: item.quantity + quantity } : item
            )
          };
        }),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((item) => (item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item))
            .filter((item) => item.quantity > 0)
        })),
      removeProduct: (productId) => set((state) => ({ items: state.items.filter((item) => item.productId !== productId) })),
      clear: () => set({ items: [] }),
      mergeServerItems: (items) =>
        set((state) => {
          const merged = new Map(state.items.map((item) => [item.productId, item]));
          items.forEach((item) => {
            const existing = merged.get(item.productId);
            merged.set(item.productId, existing ? { ...item, quantity: Math.max(existing.quantity, item.quantity) } : item);
          });
          return { items: Array.from(merged.values()) };
        })
    }),
    {
      name: "minbasket-cart",
      onRehydrateStorage: () => (state) => state?.setHydrated(true)
    }
  )
);
