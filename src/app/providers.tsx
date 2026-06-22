"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { appConfig } from "@/config/app";
import { apiClient } from "@/lib/api/client";
import { getTelegramInitData, initTelegramApp } from "@/lib/telegram/sdk";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  const [initError, setInitError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const initialize = () => {
    setInitError(null);
    setIsInitializing(true);
    try {
      initTelegramApp();
      apiClient
        .authTelegram(getTelegramInitData())
        .then((response) => {
          window.localStorage.setItem("minbasket_token", response.accessToken);
        })
        .catch(() => setInitError("Не удалось проверить Telegram-сессию"));
      window.document.documentElement.style.setProperty("--app-button", appConfig.accentColor);
    } catch {
      window.setTimeout(() => setInitError("Не удалось открыть Telegram Mini App"), 0);
    } finally {
      window.setTimeout(() => setIsInitializing(false), 180);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(initialize, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={client}>
      {isInitializing ? <LoadingScreen /> : null}
      {initError ? <InitError message={initError} onRetry={initialize} /> : null}
      {children}
    </QueryClientProvider>
  );
}

function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--app-bg)] px-6">
      <div className="w-full max-w-[280px] text-center">
        <p className="text-[24px] font-semibold tracking-[-0.02em]">{appConfig.name}</p>
        <div className="mx-auto mt-4 h-1.5 w-32 overflow-hidden rounded-full bg-[var(--app-secondary-bg)]">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--app-button)]" />
        </div>
        <p className="mt-3 text-[14px] text-[var(--app-subtitle)]">Загружаем актуальные цены</p>
      </div>
    </div>
  );
}

function InitError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-[480px] px-4 py-3 text-sm text-[var(--app-destructive)]">
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="focus-ring mt-2 min-h-10 rounded-[10px] border border-[var(--app-border)] px-3 font-medium text-[var(--app-text)]"
      >
        Повторить
      </button>
    </div>
  );
}
