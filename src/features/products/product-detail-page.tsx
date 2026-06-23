"use client";

import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { ErrorState, LoadingList } from "@/components/state";
import { QuantityControl } from "@/components/quantity-control";
import { ProductImage } from "@/features/products/components/product-image";
import { apiClient } from "@/lib/api/client";
import { getTelegramWebApp, hapticImpact, hapticSuccess } from "@/lib/telegram/sdk";
import { formatMoney, formatPackage, formatRelativeDate } from "@/lib/utils/format";
import { useCartStore } from "@/stores/cart-store";

export function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const product = useQuery({
    queryKey: ["product", params.id],
    queryFn: () => apiClient.getProduct(params.id)
  });
  const addProduct = useCartStore((state) => state.addProduct);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeProduct = useCartStore((state) => state.removeProduct);
  const cartItem = useCartStore((state) => state.items.find((item) => item.productId === params.id));

  useEffect(() => {
    const app = getTelegramWebApp();
    const back = () => router.back();
    app.BackButton.show();
    app.BackButton.onClick(back);
    return () => {
      app.BackButton.offClick(back);
      app.BackButton.hide();
    };
  }, [router]);

  return (
    <AppShell hideNav>
      <button onClick={() => router.back()} className="focus-ring mb-3 inline-flex min-h-11 items-center gap-2 rounded-[10px] text-[15px] font-medium">
        <ArrowLeft size={18} aria-hidden />
        Назад
      </button>

      {product.isLoading ? <LoadingList /> : null}
      {product.isError ? <ErrorState message="Не удалось открыть товар" onRetry={() => product.refetch()} /> : null}
      {product.data ? (
        <article>
          <div className="surface grid place-items-center p-5">
            <ProductImage src={product.data.imageUrl} alt={product.data.name} size={180} />
          </div>
          <section className="mt-4">
            <p className="text-[14px] font-medium text-[var(--app-subtitle)]">{product.data.brand ?? product.data.category.name}</p>
            <h1 className="mt-1 text-[26px] font-semibold leading-8 tracking-[-0.02em]">{product.data.name}</h1>
            <p className="mt-2 text-[14px] text-[var(--app-subtitle)]">
              {formatPackage(product.data.packageValue, product.data.packageUnit)}
            </p>
            <p className="mt-3 text-[24px] font-semibold">{formatMoney(product.data.minimumPrice)}</p>
          </section>

          <section className="mt-5">
            <h2 className="text-[18px] font-semibold">Предложения магазинов</h2>
            <div className="surface mt-3 divide-y divide-[var(--app-border)] px-3">
              {[...product.data.offers].sort((left, right) => left.price - right.price).map((offer, index) => (
                <div key={offer.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="min-w-0 text-[15px] font-semibold">{offer.store.name}</p>
                        {index === 0 && offer.inStock ? (
                          <span className="rounded-[8px] bg-[var(--app-secondary-bg)] px-2 py-1 text-[11px] font-semibold text-[var(--app-success)]">
                            Лучшая цена
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[12px] text-[var(--app-subtitle)]">
                        {offer.inStock ? "В наличии" : "Нет в наличии"} · {formatRelativeDate(offer.updatedAt)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[17px] font-semibold">{formatMoney(offer.price)}</p>
                      {offer.oldPrice ? <p className="text-[12px] text-[var(--app-hint)] line-through">{formatMoney(offer.oldPrice)}</p> : null}
                    </div>
                  </div>
                  {offer.productUrl ? (
                    <Link
                      href={offer.productUrl}
                      className="focus-ring mt-2 inline-flex min-h-9 items-center gap-1 rounded-[8px] text-[13px] font-semibold text-[var(--app-link)]"
                    >
                      В магазин <ExternalLink size={14} aria-hidden />
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <div className="app-fixed-bottom app-bottom-action fixed bottom-0 z-30 border-t border-[var(--app-border)] bg-[var(--app-section-bg)] p-3">
            {cartItem ? (
              <QuantityControl
                value={cartItem.quantity}
                onDecrease={() => (cartItem.quantity === 1 ? removeProduct(product.data.id) : setQuantity(product.data.id, cartItem.quantity - 1))}
                onIncrease={() => setQuantity(product.data.id, cartItem.quantity + 1)}
              />
            ) : (
              <button
                onClick={() => {
                  addProduct(product.data);
                  hapticImpact();
                  hapticSuccess();
                }}
                className="focus-ring h-12 w-full rounded-[12px] bg-[var(--app-button)] text-[15px] font-semibold text-[var(--app-button-text)]"
              >
                Добавить в корзину
              </button>
            )}
          </div>
        </article>
      ) : null}
    </AppShell>
  );
}
