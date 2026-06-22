"use client";

import { SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { ErrorState, LoadingList, EmptyState } from "@/components/state";
import { SearchField } from "@/components/search-field";
import { CategoryStrip } from "@/features/categories/category-strip";
import { ProductRow } from "@/features/products/components/product-row";
import { apiClient } from "@/lib/api/client";

const filterSchema = z.object({
  brand: z.string().optional(),
  storeId: z.string().optional(),
  inStockOnly: z.boolean().default(false),
  sort: z.enum(["relevance", "price_asc"]).default("relevance")
});

type FilterValues = z.input<typeof filterSchema>;

export function CatalogPage({ searchMode = false }: { searchMode?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [showFilters, setShowFilters] = useState(false);
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const form = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: { brand: "", storeId: "", inStockOnly: false, sort: "relevance" }
  });
  const filters = useWatch({ control: form.control });

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (searchMode) {
        const params = new URLSearchParams(searchParams.toString());
        if (query) params.set("q", query);
        else params.delete("q");
        router.replace(`/search?${params.toString()}`);
      }
    }, 350);
    return () => window.clearTimeout(handle);
  }, [query, router, searchMode, searchParams]);

  const products = useQuery({
    queryKey: ["products", query, categoryId, filters],
    queryFn: () =>
      apiClient.searchProducts({
        q: query,
        categoryId,
        brand: filters.brand,
        storeId: filters.storeId,
        inStockOnly: filters.inStockOnly ?? false,
        sort: filters.sort ?? "relevance",
        limit: 30
      }),
    retry: 1
  });
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => apiClient.listCategories() });
  const stores = useQuery({ queryKey: ["stores"], queryFn: () => apiClient.listStores() });
  const title = searchMode ? "Поиск" : "Каталог";

  const emptyText = useMemo(
    () => `Ничего не нашли по запросу “${query || "товары"}”. Попробуйте изменить название или выбрать категорию.`,
    [query]
  );

  return (
    <AppShell>
      <div className="sticky top-0 z-20 -mx-3 bg-[var(--app-bg)] px-3 pb-3 pt-[env(safe-area-inset-top)]">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-[26px] font-semibold tracking-[-0.02em]">{title}</h1>
          <button
            onClick={() => setShowFilters(true)}
            className="focus-ring grid h-11 w-11 place-items-center rounded-[10px] border border-[var(--app-border)] bg-[var(--app-section-bg)]"
            aria-label="Открыть фильтры"
          >
            <SlidersHorizontal size={19} aria-hidden />
          </button>
        </div>
        <SearchField
          value={query}
          onChange={setQuery}
          onSubmit={() => router.push(`/search?q=${encodeURIComponent(query)}`)}
          autoFocus={searchMode}
        />
      </div>

      <section className="mt-3">
        {categories.data ? <CategoryStrip categories={categories.data} /> : null}
      </section>

      <section className="surface mt-4 px-3">
        {products.isLoading ? <LoadingList /> : null}
        {products.isError ? <ErrorState message="Не удалось загрузить товары" onRetry={() => products.refetch()} /> : null}
        {products.data?.items.length === 0 ? <EmptyState title="Ничего не найдено" body={emptyText} /> : null}
        {products.data?.items.length ? (
          <>
            <p className="border-b border-[var(--app-border)] py-3 text-[13px] font-medium text-[var(--app-subtitle)]">
              Найдено {products.data.total}
            </p>
            {products.data.items.map((product) => (
              <ProductRow key={product.id} product={product} />
            ))}
          </>
        ) : null}
      </section>

      {showFilters ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/20" onClick={() => setShowFilters(false)}>
          <form
            onClick={(event) => event.stopPropagation()}
            onSubmit={form.handleSubmit(() => setShowFilters(false))}
            className="mx-auto w-full max-w-[480px] rounded-t-[16px] bg-[var(--app-section-bg)] p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.08)]"
          >
            <h2 className="text-[19px] font-semibold">Фильтры</h2>
            <label className="mt-4 block text-[14px] font-medium">
              Бренд
              <input {...form.register("brand")} className="focus-ring mt-2 h-11 w-full rounded-[10px] border border-[var(--app-border)] bg-transparent px-3" />
            </label>
            <label className="mt-3 block text-[14px] font-medium">
              Магазин
              <select {...form.register("storeId")} className="focus-ring mt-2 h-11 w-full rounded-[10px] border border-[var(--app-border)] bg-transparent px-3">
                <option value="">Любой</option>
                {stores.data?.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 flex min-h-11 items-center gap-3 text-[14px] font-medium">
              <input type="checkbox" {...form.register("inStockOnly")} />
              Только в наличии
            </label>
            <label className="mt-3 block text-[14px] font-medium">
              Сортировка
              <select {...form.register("sort")} className="focus-ring mt-2 h-11 w-full rounded-[10px] border border-[var(--app-border)] bg-transparent px-3">
                <option value="relevance">По релевантности</option>
                <option value="price_asc">Сначала дешевле</option>
              </select>
            </label>
            <button className="focus-ring mt-5 h-12 w-full rounded-[12px] bg-[var(--app-button)] font-semibold text-[var(--app-button-text)]">
              Показать товары
            </button>
          </form>
        </div>
      ) : null}
    </AppShell>
  );
}
