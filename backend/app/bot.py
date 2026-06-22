import asyncio
import logging

from aiogram import Bot, Dispatcher, F
from aiogram.filters import Command
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message, WebAppInfo

from app.core.config import get_settings

settings = get_settings()


def webapp_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=f"Открыть {settings.app_name}",
                    web_app=WebAppInfo(url=settings.frontend_url),
                )
            ]
        ]
    )


async def start(message: Message) -> None:
    await message.answer(
        f"{settings.app_description} в магазинах Астаны. Откройте приложение и найдите самый выгодный вариант для всей корзины.",
        reply_markup=webapp_keyboard(),
    )


async def help_command(message: Message) -> None:
    await message.answer(
        f"Откройте {settings.app_name}, найдите продукты, добавьте их в корзину и сравните итоговую стоимость по магазинам."
    )


async def main() -> None:
    if not settings.telegram_bot_token:
        logging.warning("TELEGRAM_BOT_TOKEN is empty; bot is not started")
        return
    bot = Bot(settings.telegram_bot_token)
    dp = Dispatcher()
    dp.message.register(start, Command("start"))
    dp.message.register(start, Command("app"))
    dp.message.register(help_command, Command("help"))
    dp.message.register(help_command, F.text)
    await dp.start_polling(bot)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
