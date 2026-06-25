# MinBasket: техническое описание

MinBasket - Telegram Mini App для сравнения стоимости продуктовой корзины. Текущая версия работает через реальный FastAPI backend и parser-backed каталог товаров, сформированный из нормализованных файлов в `data/*_products.json`.

## Архитектура

```text
Telegram Bot
  -> Telegram Mini App
  -> Next.js frontend
  -> FastAPI backend /api/v1
  -> SQLAlchemy users/carts
  -> parser-backed catalog repository
```

Frontend не содержит локального каталога товаров. Все экраны получают данные через `src/lib/api/client.ts`, который обращается к `NEXT_PUBLIC_API_URL`.

Backend хранит пользователей и корзины в базе данных. Каталог обслуживает `backend/app/repositories/catalog.py`: он читает нормализованные результаты парсеров, приводит текст к читаемой кодировке, строит категории, магазины, карточки товаров и офферы.

## Каталог

Основные файлы:

- `backend/app/repositories/catalog.py` - production repository для каталога.
- `backend/app/parsers/schemas.py` - контракт нормализованного товара.
- `backend/app/parsers/sources/arbuz.py` - extraction/normalization для Arbuz HTML.
- `data/arbuz_astana_products.json` - seed товаров Arbuz Astana.
- `data/arbuz_almaty_combined_products.json` - дополнительный seed товаров Arbuz Almaty.

Чтобы добавить новый источник, нужно привести его к `ParsedProduct` из `backend/app/parsers/schemas.py` и добавить путь к файлу в `CatalogConfig`.

## Запуск

Backend:

```powershell
py -m pip install -r backend\requirements.txt
cd backend
py -m uvicorn app.main:app --reload --port 8000
```

Frontend:

```powershell
npm.cmd install
npm.cmd run dev
```

Frontend открывается на `http://localhost:3000`, backend docs - на `http://localhost:8000/docs`.

## Проверки

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
cd backend
py -m pytest
```
