"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { ProductImage } from "@/features/products/components/product-image";
import { hapticImpact } from "@/lib/telegram/sdk";
import { formatMoney, formatPackage } from "@/lib/utils/format";
import { useCartStore } from "@/stores/cart-store";
import type { Product } from "@/types/domain";

export function ProductRow({ product }: { product: Product }) {
  const addProduct = useCartStore((state) => state.addProduct);
  return (
    <div className="flex gap-3 border-b border-[var(--app-border)] py-3 last:border-b-0">
      <Link href={`/products/${product.id}`} className="focus-ring flex min-w-0 flex-1 gap-3 rounded-[10px]">
        <ProductImage src={product.imageUrl} alt={product.name} />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-5">{product.name}</h3>
          <p className="mt-1 text-[13px] text-[var(--app-subtitle)]">
            {formatPackage(product.packageValue, product.packageUnit)} · {product.offersCount} магазина
          </p>
          <p className="mt-1 text-[16px] font-semibold">{formatMoney(product.minimumPrice)}</p>
        </div>
      </Link>
      <button
        onClick={() => {
          addProduct(product);
          hapticImpact();
        }}
        className="focus-ring grid h-11 w-11 shrink-0 place-items-center rounded-[10px] bg-[var(--app-button)] text-[var(--app-button-text)]"
        aria-label={`Добавить ${product.name}`}
      >
        <Plus size={18} aria-hidden />
      </button>
    </div>
  );
}
