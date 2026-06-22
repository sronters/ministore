"use client";

import { Search, X } from "lucide-react";

export function SearchField({
  value,
  onChange,
  onSubmit,
  placeholder = "Найти молоко, яйца, хлеб…",
  autoFocus = false
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex min-h-12 items-center gap-2 rounded-[12px] border border-[var(--app-border)] bg-[var(--app-section-bg)] px-3"
    >
      <Search size={19} className="text-[var(--app-hint)]" aria-hidden />
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="focus-ring min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-[var(--app-hint)]"
        placeholder={placeholder}
        aria-label="Поиск товаров"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="focus-ring grid min-h-11 min-w-11 place-items-center rounded-[10px] text-[var(--app-hint)]"
          aria-label="Очистить поиск"
        >
          <X size={18} aria-hidden />
        </button>
      ) : null}
    </form>
  );
}
