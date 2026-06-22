import { describe, expect, it } from "vitest";
import { mockProducts } from "@/mocks/catalog";
import { calculateComparison } from "@/features/comparison/lib/calculate-comparison";

describe("calculateComparison", () => {
  it("chooses the cheapest complete store", () => {
    const result = calculateComparison(
      [
        { productId: "product_001", quantity: 1 },
        { productId: "product_002", quantity: 1 },
        { productId: "product_003", quantity: 1 }
      ],
      mockProducts.filter((product) => ["product_001", "product_002", "product_003"].includes(product.id))
    );

    expect(result.bestStore?.store.id).toBe("small");
    expect(result.bestStore?.complete).toBe(true);
    expect(result.maximumSaving).toBeGreaterThan(0);
  });

  it("does not choose an incomplete cheaper store as best", () => {
    const result = calculateComparison(
      [
        { productId: "product_003", quantity: 1 },
        { productId: "product_006", quantity: 1 }
      ],
      mockProducts.filter((product) => ["product_003", "product_006"].includes(product.id))
    );

    expect(result.bestStore?.store.id).not.toBe("magnum");
    expect(result.stores.find((store) => store.store.id === "magnum")?.complete).toBe(false);
  });
});
