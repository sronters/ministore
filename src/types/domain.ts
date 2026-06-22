export type PackageUnit = "g" | "kg" | "ml" | "l" | "pcs";

export interface Category {
  id: string;
  name: string;
}

export interface StoreRef {
  id: string;
  name: string;
  logoUrl: string | null;
}

export interface Product {
  id: string;
  name: string;
  brand: string | null;
  category: Category;
  imageUrl: string | null;
  packageValue: number | null;
  packageUnit: PackageUnit | null;
  minimumPrice: number;
  oldMinimumPrice: number | null;
  offersCount: number;
  inStock: boolean;
  updatedAt: string;
}

export interface ProductOffer {
  id: string;
  productId: string;
  store: StoreRef;
  price: number;
  oldPrice: number | null;
  inStock: boolean;
  productUrl: string | null;
  updatedAt: string;
}

export interface ProductDetails extends Product {
  offers: ProductOffer[];
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface Cart {
  items: CartItem[];
}

export interface StoreComparison {
  store: StoreRef;
  total: number;
  availableItemsCount: number;
  totalItemsCount: number;
  complete: boolean;
  missingItems: Array<{
    productId: string;
    name: string;
  }>;
  differenceFromBest: number | null;
}

export interface CartComparison {
  bestStore: StoreComparison | null;
  stores: StoreComparison[];
  maximumSaving: number | null;
}

export interface SearchProductsParams {
  q?: string;
  page?: number;
  limit?: number;
  categoryId?: string;
  brand?: string;
  storeId?: string;
  inStockOnly?: boolean;
  sort?: "relevance" | "price_asc";
}

export interface SearchProductsResponse {
  items: Product[];
  page: number;
  limit: number;
  total: number;
}

export interface TelegramUser {
  id: string;
  firstName: string;
  lastName: string | null;
  username: string | null;
  city: string;
}

export interface AuthResponse {
  accessToken: string;
  user: TelegramUser;
}
