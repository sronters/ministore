"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { appConfig } from "@/config/app";
import { LoadingList, OfflineBanner } from "@/components/state";
import { SearchField } from "@/components/search-field";
import { CategoryStrip } from "@/features/categories/category-strip";
import { ProductCard } from "@/features/products/components/product-card";
import { apiClient } from "@/lib/api/client";
import { getDisplayUser } from "@/lib/telegram/sdk";
import { formatMoney, greetingFor } from "@/lib/utils/format";
import { useCartStore } from "@/stores/cart-store";

export function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const cartItems = useCartStore((state) => state.items);
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => apiClient.listCategories() });
  const popular = useQuery({
    queryKey: ["products", "popular"],
    queryFn: () => apiClient.searchProducts({ limit: 8, sort: "price_asc" })
  });
  const user = getDisplayUser();
  const firstName = user?.first_name;
  const greeting = firstName ? `${greetingFor()}, ${firstName}` : greetingFor();
  const approximateTotal = cartItems.reduce((sum, item) => sum + item.product.minimumPrice * item.quantity, 0);

  return (
    <AppShell>
      <OfflineBanner />
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[22px] font-semibold tracking-[-0.02em]">{appConfig.name}</p>
          <button className="focus-ring mt-1 inline-flex min-h-9 items-center gap-1 rounded-[8px] text-[14px] font-medium text-[var(--app-subtitle)]">
            Астана <ChevronDown size={15} aria-hidden />
          </button>
        </div>
        <button className="focus-ring grid h-10 w-10 place-items-center rounded-full bg-[var(--app-secondary-bg)] text-[14px] font-semibold">
          {(firstName ?? appConfig.name).slice(0, 1)}
        </button>
      </header>

      <section className="mt-5">
        <h1 className="text-[26px] font-semibold leading-8 tracking-[-0.02em]">
          {greeting}
        </h1>
        <p className="mt-1 text-[15px] text-[var(--app-subtitle)]">Найдём, где ваша корзина стоит дешевле.</p>
      </section>

      <section className="mt-5">
        <SearchField
          value={query}
          onChange={(value) => {
            setQuery(value);
            if (value.trim().length > 1) router.push(`/search?q=${encodeURIComponent(value)}`);
          }}
          onSubmit={() => router.push(`/search?q=${encodeURIComponent(query)}`)}
        />
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-[18px] font-semibold">Категории</h2>
        {categories.data ? <CategoryStrip categories={categories.data} /> : <div className="h-11 animate-pulse rounded-[12px] bg-[var(--app-secondary-bg)]" />}
      </section>

      {cartItems.length > 0 ? (
        <Link href="/cart" className="surface mt-5 flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold">В корзине {cartItems.length} товара</p>
            <p className="text-[13px] text-[var(--app-subtitle)]">примерно от {formatMoney(approximateTotal)}</p>
          </div>
          <span className="shrink-0 text-[15px] font-semibold text-[var(--app-button)]">Сравнить цены</span>
        </Link>
      ) : null}

      <section className="mt-6">
        <h2 className="mb-3 text-[18px] font-semibold">Популярные товары</h2>
        {popular.isLoading ? <LoadingList /> : null}
        {popular.data ? (
          <div className="grid grid-cols-2 gap-3 min-[360px]:gap-4">
            {popular.data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
