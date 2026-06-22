"use client";

import { Beef, Candy, CupSoda, Droplets, Egg, Home, Milk, Package, Wheat } from "lucide-react";
import Link from "next/link";
import type { Category } from "@/types/domain";

const icons = [Milk, Wheat, Egg, CupSoda, Package, Candy, Beef, Home, Droplets];

export function CategoryStrip({ categories }: { categories: Category[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
      {categories.map((category, index) => {
        const Icon = icons[index % icons.length];
        return (
          <Link
            key={category.id}
            href={`/search?categoryId=${category.id}`}
            className="focus-ring flex min-h-11 shrink-0 items-center gap-2 rounded-[12px] border border-[var(--app-border)] bg-[var(--app-section-bg)] px-3 text-[14px] font-medium"
          >
            <Icon size={16} className="text-[var(--app-button)]" aria-hidden />
            {category.name}
          </Link>
        );
      })}
    </div>
  );
}
