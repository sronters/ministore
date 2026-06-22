import { RefreshCw } from "lucide-react";

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[8px] bg-[var(--app-secondary-bg)] ${className}`} />;
}

export function LoadingList() {
  return (
    <div className="space-y-3" aria-label="Загрузка">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="surface flex gap-3 p-3">
          <SkeletonLine className="h-20 w-20 shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <SkeletonLine className="h-4 w-5/6" />
            <SkeletonLine className="h-4 w-2/3" />
            <SkeletonLine className="h-5 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="surface p-4">
      <p className="text-[15px] font-semibold">{message}</p>
      <button
        onClick={onRetry}
        className="focus-ring mt-3 inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[var(--app-border)] px-3 text-sm font-semibold"
      >
        <RefreshCw size={16} aria-hidden />
        Повторить
      </button>
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="surface p-5 text-center">
      <h2 className="text-[21px] font-semibold">{title}</h2>
      <p className="mt-2 text-[14px] leading-5 text-[var(--app-subtitle)]">{body}</p>
    </div>
  );
}

export function OfflineBanner() {
  return (
    <div className="mb-3 rounded-[12px] border border-[var(--app-border)] bg-[var(--app-secondary-bg)] px-3 py-2 text-[13px] font-medium text-[var(--app-subtitle)]">
      Нет подключения. Показываем сохранённые данные.
    </div>
  );
}
