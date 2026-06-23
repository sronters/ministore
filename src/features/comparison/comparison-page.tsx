"use client";

import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ErrorState, LoadingList } from "@/components/state";
import { apiClient } from "@/lib/api/client";
import { formatMoney } from "@/lib/utils/format";
import { useCartStore } from "@/stores/cart-store";

export function ComparisonPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const comparison = useQuery({
    queryKey: ["comparison", items.map((item) => `${item.productId}:${item.quantity}`).join(",")],
    queryFn: () => apiClient.compareCart(items.map((item) => ({ productId: item.productId, quantity: item.quantity }))),
    enabled: items.length > 0
  });

  if (items.length === 0) {
    return (
      <AppShell hideNav>
        <EmptyState title="Корзина пустая" body="Добавьте продукты, чтобы сравнить магазины." />
        <Link href="/catalog" className="focus-ring mt-4 flex h-12 items-center justify-center rounded-[12px] bg-[var(--app-button)] font-semibold text-[var(--app-button-text)]">
          Перейти в каталог
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell hideNav>
      <button onClick={() => router.back()} className="focus-ring mb-3 inline-flex min-h-11 items-center gap-2 rounded-[10px] text-[15px] font-medium">
        <ArrowLeft size={18} aria-hidden />
        Изменить корзину
      </button>
      <h1 className="text-[26px] font-semibold tracking-[-0.02em]">Сравнение корзины</h1>

      {comparison.isLoading ? <div className="mt-4"><LoadingList /></div> : null}
      {comparison.isError ? <div className="mt-4"><ErrorState message="Не удалось сравнить магазины" onRetry={() => comparison.refetch()} /></div> : null}
      {comparison.data?.bestStore ? (
        <section className="mt-4">
          <div className="surface p-4">
            <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--app-section-header)]">Лучший вариант</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[24px] font-semibold">{comparison.data.bestStore.store.name}</h2>
                <p className="mt-1 text-[14px] text-[var(--app-subtitle)]">
                  {comparison.data.bestStore.complete
                    ? `Все ${comparison.data.bestStore.totalItemsCount} товара в наличии`
                    : `Доступно ${comparison.data.bestStore.availableItemsCount} из ${comparison.data.bestStore.totalItemsCount}`}
                </p>
              </div>
              <p className="shrink-0 text-[24px] font-semibold">{formatMoney(comparison.data.bestStore.total)}</p>
            </div>
            {comparison.data.maximumSaving !== null && comparison.data.maximumSaving > 0 ? (
              <p className="mt-3 text-[15px] font-medium text-[var(--app-success)]">
                Экономия до {formatMoney(comparison.data.maximumSaving)}
              </p>
            ) : comparison.data.bestStore.complete ? (
              <p className="mt-3 text-[14px] text-[var(--app-subtitle)]">Полные корзины стоят почти одинаково.</p>
            ) : (
              <p className="mt-3 text-[14px] text-[var(--app-warning)]">Ни в одном магазине нет всей корзины. Экономию не показываем.</p>
            )}
          </div>

          <div className="surface mt-4 divide-y divide-[var(--app-border)] px-3">
            {comparison.data.stores.map((store) => (
              <div key={store.store.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[16px] font-semibold">{store.store.name}</p>
                    <p className={`mt-1 text-[13px] ${store.complete ? "text-[var(--app-success)]" : "text-[var(--app-destructive)]"}`}>
                      {store.complete
                        ? `Все ${store.totalItemsCount} товара в наличии`
                        : `Доступно ${store.availableItemsCount} из ${store.totalItemsCount}`}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[18px] font-semibold">{formatMoney(store.total)}</p>
                    {store.differenceFromBest !== null && store.differenceFromBest > 0 ? (
                      <p className="text-[12px] text-[var(--app-subtitle)]">+{formatMoney(store.differenceFromBest)}</p>
                    ) : null}
                  </div>
                </div>
                {store.missingItems.length > 0 ? (
                  <p className="mt-2 rounded-[10px] bg-[var(--app-secondary-bg)] px-3 py-2 text-[13px] text-[var(--app-subtitle)]">
                    Нет: {store.missingItems.map((item) => item.name).join(", ")}
                  </p>
                ) : null}
                {store.complete ? (
                  <a
                    href={`https://${store.store.id}.kz`}
                    className="focus-ring mt-2 inline-flex min-h-9 items-center gap-1 rounded-[8px] text-[13px] font-semibold text-[var(--app-link)]"
                  >
                    Перейти в магазин <ExternalLink size={14} aria-hidden />
                  </a>
                ) : null}
              </div>
            ))}
          </div>

          <Link href="/cart" className="focus-ring mt-4 flex h-12 items-center justify-center rounded-[12px] border border-[var(--app-border)] bg-[var(--app-section-bg)] font-semibold">
            Изменить корзину
          </Link>
        </section>
      ) : null}
    </AppShell>
  );
}
