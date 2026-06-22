export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "MinBasket",
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Сравнение цен на продукты",
  telegramBotUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "",
  accentColor: process.env.NEXT_PUBLIC_ACCENT_COLOR || "#2AABEE"
} as const;
