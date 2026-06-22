import type { CartComparison, ProductDetails, StoreComparison } from "@/types/domain";

export interface QuantityItem {
  productId: string;
  quantity: number;
}

export function calculateComparison(items: QuantityItem[], products: ProductDetails[]): CartComparison {
  if (items.length === 0) {
    return { bestStore: null, stores: [], maximumSaving: null };
  }

  const quantities = new Map(items.map((item) => [item.productId, item.quantity]));
  const stores = new Map<string, ProductDetails["offers"][number]["store"]>();

  products.forEach((product) => {
    product.offers.forEach((offer) => stores.set(offer.store.id, offer.store));
  });

  const comparisons: StoreComparison[] = Array.from(stores.values())
    .map((store) => {
      let total = 0;
      let availableItemsCount = 0;
      const missingItems: StoreComparison["missingItems"] = [];

      products.forEach((product) => {
        const quantity = quantities.get(product.id) ?? 0;
        const offer = product.offers.find((candidate) => candidate.store.id === store.id && candidate.inStock);
        if (!offer) {
          missingItems.push({ productId: product.id, name: product.name });
          return;
        }

        total += offer.price * quantity;
        availableItemsCount += 1;
      });

      return {
        store,
        total,
        availableItemsCount,
        totalItemsCount: products.length,
        complete: missingItems.length === 0,
        missingItems,
        differenceFromBest: null
      };
    })
    .sort((left, right) => {
      if (left.complete !== right.complete) return left.complete ? -1 : 1;
      if (left.availableItemsCount !== right.availableItemsCount) {
        return right.availableItemsCount - left.availableItemsCount;
      }
      return left.total - right.total;
    });

  const completeStores = comparisons.filter((item) => item.complete);
  const bestStore = completeStores[0] ?? comparisons[0] ?? null;
  const maximumSaving =
    bestStore && completeStores.length > 0 ? Math.max(...completeStores.map((item) => item.total)) - bestStore.total : null;

  const storesWithDifference = comparisons.map((item) => ({
    ...item,
    differenceFromBest: bestStore && item.complete && bestStore.complete ? item.total - bestStore.total : null
  }));

  return {
    bestStore: bestStore
      ? storesWithDifference.find((item) => item.store.id === bestStore.store.id) ?? bestStore
      : null,
    stores: storesWithDifference,
    maximumSaving
  };
}
