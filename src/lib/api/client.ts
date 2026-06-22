import { requestJson, useMockApi } from "@/lib/api/http-client";
import { mockProvider } from "@/lib/api/mock-provider";
import type {
  AuthResponse,
  Cart,
  CartComparison,
  Category,
  ProductDetails,
  SearchProductsParams,
  SearchProductsResponse,
  StoreRef
} from "@/types/domain";

function paramsToSearch(params: SearchProductsParams): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  return search.toString();
}

export const apiClient = {
  authTelegram(initData: string): Promise<AuthResponse> {
    if (useMockApi) return mockProvider.authTelegram();
    return requestJson<AuthResponse>("/auth/telegram", {
      method: "POST",
      body: JSON.stringify({ initData })
    });
  },

  searchProducts(params: SearchProductsParams): Promise<SearchProductsResponse> {
    if (useMockApi) return mockProvider.searchProducts(params);
    return requestJson<SearchProductsResponse>(`/products/search?${paramsToSearch(params)}`);
  },

  getProduct(productId: string): Promise<ProductDetails> {
    if (useMockApi) return mockProvider.getProduct(productId);
    return requestJson<ProductDetails>(`/products/${productId}`);
  },

  listCategories(): Promise<Category[]> {
    if (useMockApi) return mockProvider.listCategories();
    return requestJson<Category[]>("/categories");
  },

  listStores(): Promise<StoreRef[]> {
    if (useMockApi) return mockProvider.listStores();
    return requestJson<StoreRef[]>("/stores");
  },

  batch(productIds: string[]): Promise<ProductDetails[]> {
    if (useMockApi) return mockProvider.batch(productIds);
    return requestJson<ProductDetails[]>("/products/batch", {
      method: "POST",
      body: JSON.stringify({ productIds })
    });
  },

  getCart(): Promise<Cart> {
    if (useMockApi) return mockProvider.getCart();
    return requestJson<Cart>("/cart");
  },

  addCartItem(productId: string, quantity: number): Promise<Cart> {
    if (useMockApi) return mockProvider.addCartItem(productId, quantity);
    return requestJson<Cart>("/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, quantity })
    });
  },

  updateCartItem(productId: string, quantity: number): Promise<Cart> {
    if (useMockApi) return mockProvider.updateCartItem(productId, quantity);
    return requestJson<Cart>(`/cart/items/${productId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity })
    });
  },

  deleteCartItem(productId: string): Promise<Cart> {
    if (useMockApi) return mockProvider.deleteCartItem(productId);
    return requestJson<Cart>(`/cart/items/${productId}`, { method: "DELETE" });
  },

  clearCart(): Promise<Cart> {
    if (useMockApi) return mockProvider.clearCart();
    return requestJson<Cart>("/cart", { method: "DELETE" });
  },

  compareCart(items?: Array<{ productId: string; quantity: number }>): Promise<CartComparison> {
    if (useMockApi) return mockProvider.compareCart(items);
    const suffix = items ? "" : "";
    return requestJson<CartComparison>(`/cart/comparison${suffix}`);
  }
};
