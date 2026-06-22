"use client";

import { Minus, Plus } from "lucide-react";

export function QuantityControl({
  value,
  onDecrease,
  onIncrease,
  className = ""
}: {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  className?: string;
}) {
  return (
    <div
      className={`inline-grid min-h-11 grid-cols-[44px_1fr_44px] items-center rounded-[10px] border border-[var(--app-border)] bg-[var(--app-section-bg)] ${className}`}
    >
      <button type="button" onClick={onDecrease} className="focus-ring grid h-11 w-11 place-items-center rounded-[10px]" aria-label="Уменьшить">
        <Minus size={16} aria-hidden />
      </button>
      <span className="text-center text-[15px] font-semibold tabular-nums">{value}</span>
      <button type="button" onClick={onIncrease} className="focus-ring grid h-11 w-11 place-items-center rounded-[10px]" aria-label="Увеличить">
        <Plus size={16} aria-hidden />
      </button>
    </div>
  );
}
