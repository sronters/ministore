import { requestJson } from "@/lib/api/http-client";
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
    return requestJson<AuthResponse>("/auth/telegram", {
      method: "POST",
      body: JSON.stringify({ initData })
    });
  },

  searchProducts(params: SearchProductsParams): Promise<SearchProductsResponse> {
    return requestJson<SearchProductsResponse>(`/products/search?${paramsToSearch(params)}`);
  },

  getProduct(productId: string): Promise<ProductDetails> {
    return requestJson<ProductDetails>(`/products/${productId}`);
  },

  listCategories(): Promise<Category[]> {
    return requestJson<Category[]>("/categories");
  },

  listStores(): Promise<StoreRef[]> {
    return requestJson<StoreRef[]>("/stores");
  },

  batch(productIds: string[]): Promise<ProductDetails[]> {
    return requestJson<ProductDetails[]>("/products/batch", {
      method: "POST",
      body: JSON.stringify({ productIds })
    });
  },

  getCart(): Promise<Cart> {
    return requestJson<Cart>("/cart");
  },

  addCartItem(productId: string, quantity: number): Promise<Cart> {
    return requestJson<Cart>("/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, quantity })
    });
  },

  updateCartItem(productId: string, quantity: number): Promise<Cart> {
    return requestJson<Cart>(`/cart/items/${productId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity })
    });
  },

  deleteCartItem(productId: string): Promise<Cart> {
    return requestJson<Cart>(`/cart/items/${productId}`, { method: "DELETE" });
  },

  clearCart(): Promise<Cart> {
    return requestJson<Cart>("/cart", { method: "DELETE" });
  },

  compareCart(items?: Array<{ productId: string; quantity: number }>): Promise<CartComparison> {
    const suffix = items ? "" : "";
    return requestJson<CartComparison>(`/cart/comparison${suffix}`);
  }
};
