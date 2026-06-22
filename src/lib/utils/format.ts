export function formatMoney(value: number): string {
  return `${new Intl.NumberFormat("ru-KZ", { maximumFractionDigits: 0 }).format(value)} ₸`;
}

export function formatPackage(value: number | null, unit: string | null): string {
  if (value === null || unit === null) return "";
  return `${value} ${unit}`;
}

export function formatRelativeDate(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const diffMs = now.getTime() - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  if (diffMs < hour) {
    const minutes = Math.max(1, Math.floor(diffMs / minute));
    return `обновлено ${minutes} минут назад`;
  }

  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return `обновлено сегодня в ${date.toLocaleTimeString("ru-KZ", { hour: "2-digit", minute: "2-digit" })}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "обновлено вчера";
  }

  return `обновлено ${date.toLocaleDateString("ru-KZ", { day: "2-digit", month: "short" })}`;
}

export function greetingFor(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}
