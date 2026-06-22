import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "@/stores/cart-store";
import { mockProducts } from "@/mocks/catalog";

const product = mockProducts[0];
const summary = {
  id: product.id,
  name: product.name,
  brand: product.brand,
  category: product.category,
  imageUrl: product.imageUrl,
  packageValue: product.packageValue,
  packageUnit: product.packageUnit,
  minimumPrice: product.minimumPrice,
  oldMinimumPrice: product.oldMinimumPrice,
  offersCount: product.offersCount,
  inStock: product.inStock,
  updatedAt: product.updatedAt
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
