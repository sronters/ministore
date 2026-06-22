import { mockCategories, mockProducts, mockStores } from "@/mocks/catalog";
import { appConfig } from "@/config/app";
import { calculateComparison } from "@/features/comparison/lib/calculate-comparison";
import { fuzzyIncludes, normalizeText } from "@/lib/utils/search";
import type {
  Cart,
  CartItem,
  CartComparison,
  ProductDetails,
  SearchProductsParams,
  SearchProductsResponse
} from "@/types/domain";

let localCart: Array<{ productId: string; quantity: number }> = [];

const delay = () => new Promise((resolve) => setTimeout(resolve, 120));

function withoutOffers(product: ProductDetails) {
  return {
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
}

function toCart(): Cart {
  const items: CartItem[] = localCart
    .map((item) => {
      const product = mockProducts.find((candidate) => candidate.id === item.productId);
      if (!product) return null;
      return {
        id: item.productId,
        productId: item.productId,
        quantity: item.quantity,
        product: withoutOffers(product)
      };
    })
    .filter((item): item is CartItem => item !== null);
  return { items };
}

export const mockProvider = {
  async authTelegram() {
    await delay();
    return {
      accessToken: "mock-access-token",
      user: {
        id: "mock-user",
        firstName: process.env.NODE_ENV === "development" ? "Dev" : appConfig.name,
        lastName: null,
        username: "dev",
        city: "Астана"
      }
    };
  },

  async searchProducts(params: SearchProductsParams): Promise<SearchProductsResponse> {
    await delay();
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const query = params.q ?? "";
    const filtered = mockProducts.filter((product) => {
      const searchable = `${product.name} ${product.brand ?? ""} ${product.category.name}`;
      const matchesQuery = fuzzyIncludes(searchable, query);
      const matchesCategory = !params.categoryId || product.category.id === params.categoryId;
      const matchesBrand = !params.brand || normalizeText(product.brand ?? "").includes(normalizeText(params.brand));
      const matchesStore =
        !params.storeId || product.offers.some((offer) => offer.store.id === params.storeId && offer.inStock);
      const matchesStock = !params.inStockOnly || product.inStock;
      return matchesQuery && matchesCategory && matchesBrand && matchesStore && matchesStock;
    });
    const sorted =
      params.sort === "price_asc" ? [...filtered].sort((left, right) => left.minimumPrice - right.minimumPrice) : filtered;
    const start = (page - 1) * limit;
    return {
      items: sorted.slice(start, start + limit).map(withoutOffers),
      page,
      limit,
      total: sorted.length
    };
  },

  async getProduct(productId: string): Promise<ProductDetails> {
    await delay();
    const product = mockProducts.find((item) => item.id === productId);
    if (!product) throw new Error("PRODUCT_NOT_FOUND");
    return product;
  },

  async listCategories() {
    await delay();
    return mockCategories;
  },

  async listStores() {
    await delay();
    return mockStores;
  },

  async batch(productIds: string[]) {
    await delay();
    const ids = new Set(productIds);
    return mockProducts.filter((product) => ids.has(product.id));
  },

  async getCart() {
    await delay();
    return toCart();
  },

  async addCartItem(productId: string, quantity: number) {
    await delay();
    const existing = localCart.find((item) => item.productId === productId);
    if (existing) existing.quantity += quantity;
    else localCart.push({ productId, quantity });
    return toCart();
  },

  async updateCartItem(productId: string, quantity: number) {
    await delay();
    localCart = localCart.map((item) => (item.productId === productId ? { ...item, quantity } : item));
    return toCart();
  },

  async deleteCartItem(productId: string) {
    await delay();
    localCart = localCart.filter((item) => item.productId !== productId);
    return toCart();
  },

  async clearCart() {
    await delay();
    localCart = [];
    return toCart();
  },

  async compareCart(items?: Array<{ productId: string; quantity: number }>): Promise<CartComparison> {
    await delay();
    const sourceItems = items ?? localCart;
    const products = mockProducts.filter((product) => sourceItems.some((item) => item.productId === product.id));
    return calculateComparison(
      sourceItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      products
    );
  }
};
