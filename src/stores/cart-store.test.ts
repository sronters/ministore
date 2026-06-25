import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "@/stores/cart-store";
import type { Product } from "@/types/domain";

const summary: Product = {
  id: "arbuz:230966",
  name: "Milk 1 l",
  brand: "FoodMaster",
  category: { id: "dairy", name: "Dairy" },
  imageUrl: null,
  packageValue: 1,
  packageUnit: "l",
  minimumPrice: 843,
  oldMinimumPrice: 1125,
  offersCount: 1,
  inStock: true,
  updatedAt: "2026-06-25T00:00:00+00:00"
};

describe("cart store", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it("adds a product to cart", () => {
    useCartStore.getState().addProduct(summary);
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it("changes quantity without duplicates", () => {
    useCartStore.getState().addProduct(summary);
    useCartStore.getState().addProduct(summary);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it("removes product", () => {
    useCartStore.getState().addProduct(summary);
    useCartStore.getState().removeProduct(summary.id);
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
