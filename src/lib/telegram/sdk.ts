export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: {
    user?: TelegramWebAppUser;
  };
  colorScheme?: "light" | "dark";
  ready: () => void;
  expand: () => void;
  onEvent: (eventType: string, eventHandler: () => void) => void;
  offEvent: (eventType: string, eventHandler: () => void) => void;
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  MainButton: {
    text: string;
    show: () => void;
    hide: () => void;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  HapticFeedback?: {
    impactOccurred: (style: "light" | "medium" | "heavy") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
    __telegramSdkPromise?: Promise<void>;
  }
}

const telegramSdkUrl = "https://telegram.org/js/telegram-web-app.js";

function fallbackWebApp(): TelegramWebApp {
  const isDevelopment = process.env.NODE_ENV === "development";
  return {
    initData: "",
    initDataUnsafe: {
      user: isDevelopment
        ? {
            id: 1,
            first_name: "Dev",
            username: "dev",
            language_code: "ru"
          }
        : undefined
    },
    colorScheme: "light",
    ready: () => undefined,
    expand: () => undefined,
    onEvent: () => undefined,
    offEvent: () => undefined,
    BackButton: {
      show: () => undefined,
      hide: () => undefined,
      onClick: () => undefined,
      offClick: () => undefined
    },
    MainButton: {
      text: "",
      show: () => undefined,
      hide: () => undefined,
      setText: () => undefined,
      onClick: () => undefined,
      offClick: () => undefined
    },
    HapticFeedback: {
      impactOccurred: () => undefined,
      notificationOccurred: () => undefined
    }
  };
}

export function getTelegramWebApp(): TelegramWebApp {
  if (typeof window === "undefined") return fallbackWebApp();
  return window.Telegram?.WebApp ?? fallbackWebApp();
}

export function loadTelegramSdk(): Promise<void> {
  if (typeof window === "undefined" || window.Telegram?.WebApp) {
    return Promise.resolve();
  }

  if (window.__telegramSdkPromise) {
    return window.__telegramSdkPromise;
  }

  window.__telegramSdkPromise = new Promise((resolve) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${telegramSdkUrl}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => resolve(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = telegramSdkUrl;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });

  return window.__telegramSdkPromise;
}

export async function initTelegramApp(): Promise<TelegramWebApp> {
  await loadTelegramSdk();
  const app = getTelegramWebApp();
  app.ready();
  app.expand();
  return app;
}

export function getTelegramInitData(): string {
  return getTelegramWebApp().initData;
}

export function getDisplayUser() {
  return getTelegramWebApp().initDataUnsafe?.user;
}

export function hapticImpact() {
  getTelegramWebApp().HapticFeedback?.impactOccurred("light");
}

export function hapticSuccess() {
  getTelegramWebApp().HapticFeedback?.notificationOccurred("success");
}
