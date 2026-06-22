"use client";

import { ShoppingBasket, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { QuantityControl } from "@/components/quantity-control";
import { ProductImage } from "@/features/products/components/product-image";
import { getTelegramWebApp } from "@/lib/telegram/sdk";
import { formatMoney } from "@/lib/utils/format";
import { useCartStore } from "@/stores/cart-store";

export function CartPage() {
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeProduct = useCartStore((state) => state.removeProduct);
  const total = items.reduce((sum, item) => sum + item.product.minimumPrice * item.quantity, 0);

  useEffect(() => {
    const app = getTelegramWebApp();
    if (items.length === 0) {
      app.MainButton.hide();
      return;
    }
    app.MainButton.setText("Сравнить цены");
    app.MainButton.show();
    const openComparison = () => {
      window.location.href = "/cart/comparison";
    };
    app.MainButton.onClick(openComparison);
    return () => {
      app.MainButton.offClick(openComparison);
      app.MainButton.hide();
    };
  }, [items.length]);

  if (items.length === 0) {
    return (
      <AppShell>
        <section className="surface mt-16 p-6 text-center">
          <ShoppingBasket size={36} className="mx-auto text-[var(--app-hint)]" aria-hidden />
          <h1 className="mt-4 text-[24px] font-semibold">Корзина пока пустая</h1>
          <p className="mt-2 text-[15px] leading-6 text-[var(--app-subtitle)]">Добавьте продукты, чтобы сравнить их стоимость в магазинах</p>
          <Link href="/catalog" className="focus-ring mt-5 inline-flex min-h-12 items-center rounded-[12px] bg-[var(--app-button)] px-4 font-semibold text-[var(--app-button-text)]">
            Перейти в каталог
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-[26px] font-semibold tracking-[-0.02em]">Корзина</h1>
      <p className="mt-1 text-[14px] text-[var(--app-subtitle)]">Сравним покупку всей корзины в одном магазине.</p>

      <section className="surface mt-4 divide-y divide-[var(--app-border)] px-3">
        {items.map((item) => (
          <div key={item.productId} className="py-3">
            <div className="flex gap-3">
              <ProductImage src={item.product.imageUrl} alt={item.product.name} size={58} />
              <div className="min-w-0 flex-1">
                <Link href={`/products/${item.productId}`} className="focus-ring line-clamp-2 rounded-[8px] text-[15px] font-semibold leading-5">
                  {item.product.name}
                </Link>
                <p className="mt-1 text-[14px] text-[var(--app-subtitle)]">от {formatMoney(item.product.minimumPrice)}</p>
              </div>
              <button
                onClick={() => removeProduct(item.productId)}
                className="focus-ring grid h-11 w-11 place-items-center rounded-[10px] text-[var(--app-destructive)]"
                aria-label={`Удалить ${item.product.name}`}
              >
                <Trash2 size={18} aria-hidden />
              </button>
            </div>
            <div className="mt-3">
              <QuantityControl
                value={item.quantity}
                onDecrease={() => (item.quantity === 1 ? removeProduct(item.productId) : setQuantity(item.productId, item.quantity - 1))}
                onIncrease={() => setQuantity(item.productId, item.quantity + 1)}
              />
            </div>
          </div>
        ))}
      </section>

      <section className="surface mt-4 p-4">
        <div className="flex items-center justify-between text-[15px]">
          <span className="text-[var(--app-subtitle)]">Позиций</span>
          <span className="font-semibold">{items.length}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[15px]">
          <span className="text-[var(--app-subtitle)]">Примерно от</span>
          <span className="font-semibold">{formatMoney(total)}</span>
        </div>
        <Link href="/cart/comparison" className="focus-ring mt-4 flex h-12 items-center justify-center rounded-[12px] bg-[var(--app-button)] font-semibold text-[var(--app-button-text)]">
          Сравнить магазины
        </Link>
      </section>
    </AppShell>
  );
}
