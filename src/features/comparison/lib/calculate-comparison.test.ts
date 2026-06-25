import { describe, expect, it } from "vitest";
import { calculateComparison } from "@/features/comparison/lib/calculate-comparison";
import type { ProductDetails, StoreRef } from "@/types/domain";

const small: StoreRef = { id: "small", name: "Small", logoUrl: null };
const arbuz: StoreRef = { id: "arbuz", name: "Arbuz", logoUrl: null };
const magnum: StoreRef = { id: "magnum", name: "Magnum", logoUrl: null };
const category = { id: "dairy", name: "Dairy" };

function product(id: string, offers: ProductDetails["offers"]): ProductDetails {
  const prices = offers.filter((offer) => offer.inStock).map((offer) => offer.price);
  return {
    id,
    name: id,
    brand: null,
    category,
    imageUrl: null,
    packageValue: null,
    packageUnit: null,
    minimumPrice: Math.min(...prices),
    oldMinimumPrice: null,
    offersCount: offers.length,
    inStock: prices.length > 0,
    updatedAt: "2026-06-25T00:00:00+00:00",
    offers
  };
}

function offer(productId: string, store: StoreRef, price: number, inStock = true): ProductDetails["offers"][number] {
  return {
    id: `${productId}:${store.id}`,
    productId,
    store,
    price,
    oldPrice: null,
    inStock,
    productUrl: null,
    updatedAt: "2026-06-25T00:00:00+00:00"
  };
}

describe("calculateComparison", () => {
  it("chooses the cheapest complete store", () => {
    const products = [
      product("milk", [offer("milk", small, 400), offer("milk", arbuz, 450), offer("milk", magnum, 430)]),
      product("eggs", [offer("eggs", small, 800), offer("eggs", arbuz, 790), offer("eggs", magnum, 820)]),
      product("bread", [offer("bread", small, 200), offer("bread", arbuz, 240), offer("bread", magnum, 230)])
    ];
    const result = calculateComparison(
      [
        { productId: "milk", quantity: 1 },
        { productId: "eggs", quantity: 1 },
        { productId: "bread", quantity: 1 }
      ],
      products
    );

    expect(result.bestStore?.store.id).toBe("small");
    expect(result.bestStore?.complete).toBe(true);
    expect(result.maximumSaving).toBeGreaterThan(0);
  });

  it("does not choose an incomplete cheaper store as best", () => {
    const products = [
      product("bread", [offer("bread", small, 220), offer("bread", magnum, 100, false)]),
      product("detergent", [offer("detergent", small, 3500), offer("detergent", magnum, 3000, false)])
    ];
    const result = calculateComparison(
      [
        { productId: "bread", quantity: 1 },
        { productId: "detergent", quantity: 1 }
      ],
      products
    );

    expect(result.bestStore?.store.id).not.toBe("magnum");
    expect(result.stores.find((store) => store.store.id === "magnum")?.complete).toBe(false);
  });
});
