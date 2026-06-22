"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { QuantityControl } from "@/components/quantity-control";
import { ProductImage } from "@/features/products/components/product-image";
import { hapticImpact } from "@/lib/telegram/sdk";
import { formatMoney, formatPackage } from "@/lib/utils/format";
import { useCartStore } from "@/stores/cart-store";
import type { Product } from "@/types/domain";

export function ProductCard({ product }: { product: Product }) {
  const item = useCartStore((state) => state.items.find((candidate) => candidate.productId === product.id));
  const addProduct = useCartStore((state) => state.addProduct);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeProduct = useCartStore((state) => state.removeProduct);

  return (
    <article className="surface p-3">
      <Link href={`/products/${product.id}`} className="focus-ring block rounded-[12px]">
        <ProductImage src={product.imageUrl} alt={product.name} size={92} />
        <div className="mt-3 min-h-[74px]">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-5">{product.name}</h3>
          <p className="mt-1 text-[13px] text-[var(--app-subtitle)]">
            {product.brand ?? product.category.name} · {formatPackage(product.packageValue, product.packageUnit)}
          </p>
        </div>
        <div className="mt-2">
          <p className="text-[17px] font-semibold">{formatMoney(product.minimumPrice)}</p>
          <p className="text-[12px] text-[var(--app-hint)]">в {product.offersCount} магазинах</p>
        </div>
      </Link>
      <div className="mt-3">
        {item ? (
          <QuantityControl
            value={item.quantity}
            onDecrease={() => (item.quantity === 1 ? removeProduct(product.id) : setQuantity(product.id, item.quantity - 1))}
            onIncrease={() => setQuantity(product.id, item.quantity + 1)}
            className="w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              addProduct(product);
              hapticImpact();
            }}
            className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[var(--app-button)] px-3 text-[15px] font-semibold text-[var(--app-button-text)]"
          >
            <Plus size={17} aria-hidden />
            Добавить
          </button>
        )}
      </div>
    </article>
  );
}
