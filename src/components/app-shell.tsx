"use client";

import { House, LayoutGrid, ShoppingBasket } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollAccelerator } from "@/components/scroll-accelerator";
import { useCartStore } from "@/stores/cart-store";

const navItems = [
  { href: "/", label: "Главная", icon: House },
  { href: "/catalog", label: "Каталог", icon: LayoutGrid },
  { href: "/cart", label: "Корзина", icon: ShoppingBasket }
];

export function AppShell({ children, hideNav = false }: { children: React.ReactNode; hideNav?: boolean }) {
  return (
    <div className="app-shell">
      <ScrollAccelerator />
      {children}
      {hideNav ? null : <BottomNav />}
    </div>
  );
}

function BottomNav() {
  const pathname = usePathname();
  const count = useCartStore((state) => state.items.length);

  return (
    <nav className="app-fixed-bottom app-bottom-nav fixed bottom-0 z-30 border-t border-[var(--app-border)] bg-[var(--app-section-bg)] px-3 pt-2 shadow-[0_-6px_18px_rgba(0,0,0,0.04)]">
      <div className="grid grid-cols-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`focus-ring relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-[10px] text-xs font-semibold ${
                active ? "text-[var(--app-button)]" : "text-[var(--app-hint)]"
              }`}
            >
              <Icon size={20} strokeWidth={2.2} aria-hidden />
              <span>{item.label}</span>
              {item.href === "/cart" && count > 0 ? (
                <span className="absolute right-[28%] top-1 min-w-4 rounded-full bg-[var(--app-destructive)] px-1 text-[10px] font-semibold leading-4 text-white">
                  {count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
