# MinBasket

MinBasket is a production-oriented Telegram Mini App MVP for comparing grocery basket prices in Astana.

The main flow is:

1. Open the Telegram bot.
2. Tap `Открыть MinBasket`.
3. Search for products.
4. Open product cards and compare store offers.
5. Add products to cart.
6. Change quantities.
7. Compare the full basket by store.
8. Return later with the cart preserved locally and sync-ready for backend storage.

## Architecture

```text
Telegram Bot (aiogram)
  -> Telegram Mini App (Next.js)
  -> FastAPI /api/v1
  -> PostgreSQL for users and carts
  -> parser-backed grocery catalog seed files
```

Frontend never imports catalog data directly from components. UI uses `src/lib/api/client.ts`, which calls the FastAPI backend.

Backend stores users and carts in SQLAlchemy and serves product catalog data from normalized parser output in `data/*_products.json`.

## Stack

- Next.js 16 App Router
- TypeScript strict mode
- Tailwind CSS
- Lucide Icons
- Geist Sans via `next/font/google`
- TanStack Query
- Zustand
- React Hook Form + Zod
- FastAPI
- SQLAlchemy 2 async
- Alembic
- PostgreSQL
- aiogram 3
- Docker Compose
- Vitest and pytest

## Requirements

- Node.js 24+
- Python 3.12+
- Docker Desktop for compose
- Telegram bot token for real Telegram launch

On this Windows machine use `npm.cmd` and `py` commands.

## Local Frontend

```powershell
npm.cmd install
npm.cmd run dev
```

Frontend runs at `http://localhost:3000`.

Run the backend first; the frontend calls `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`.

## Local Backend

```powershell
py -m pip install -r backend\requirements.txt
cd backend
py -m uvicorn app.main:app --reload --port 8000
```

Backend docs are at `http://localhost:8000/docs`.

## Telegram BotFather Setup

1. Create a bot in BotFather.
2. Set the bot username in `TELEGRAM_BOT_USERNAME`.
3. Configure the Web App URL to your deployed or tunneled frontend URL.
4. Set:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
TELEGRAM_WEBAPP_URL=
FRONTEND_URL=http://localhost:3000
```

Run the bot:

```powershell
cd backend
py -m app.bot
```

Commands:

- `/start`
- `/app`
- `/help`

The chat bot only launches the Mini App. Catalog and cart UX live in the Mini App.

## Environment Variables

See `.env.example`.

Important values:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
TELEGRAM_WEBAPP_URL=
APP_NAME=MinBasket
APP_DESCRIPTION=Сравнение цен на продукты
DATABASE_URL=postgresql+asyncpg://minbasket:minbasket@postgres:5432/minbasket
JWT_SECRET=
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=MinBasket
NEXT_PUBLIC_APP_DESCRIPTION=Сравнение цен на продукты
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=
NEXT_PUBLIC_ACCENT_COLOR=#2AABEE
```

Product name, short description, Telegram bot username and accent color are configuration values. Runtime UI, metadata, loading screen, bot messages and API title read them from environment-backed config instead of hardcoded component strings.

## Telegram Auth

Frontend sends full `Telegram.WebApp.initData` to:

```http
POST /api/v1/auth/telegram
```

Backend verifies Telegram initData using the official HMAC algorithm:

- removes `hash`;
- sorts fields;
- creates `data_check_string`;
- derives secret with `WebAppData`;
- compares hashes with `hmac.compare_digest`;
- checks `auth_date` age;
- creates or returns user;
- returns an access token.

In development, if `TELEGRAM_BOT_TOKEN` is empty and `initData` is empty, backend returns a local development user.

## API Contract

Implemented frontend client endpoints:

```http
POST /api/v1/auth/telegram
GET /api/v1/products/search
GET /api/v1/products/{product_id}
GET /api/v1/categories
GET /api/v1/stores
POST /api/v1/products/batch
GET /api/v1/cart
POST /api/v1/cart/items
PATCH /api/v1/cart/items/{item_id}
DELETE /api/v1/cart/items/{item_id}
DELETE /api/v1/cart
GET /api/v1/cart/comparison
```

## Parser-backed Catalog

The application serves normalized product data from parser output files:

```text
data/arbuz_astana_products.json
data/arbuz_almaty_combined_products.json
data/arbuz_live_products.json
data/magnum_live_products.json
data/small_live_products.json
backend/app/repositories/catalog.py
```

Add or refresh a source by producing the same normalized parser schema used by `backend/app/parsers/schemas.py`, then include that file in `CatalogConfig`.

Current parser sources:

- Arbuz: saved/live HTML collection pages.
- Magnum: live public API at `https://magnum.kz:1337/api/products`.
- Small: saved public discount snapshot text, because `small.kz` blocks server-side requests with 403.

## Tests

Frontend:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

Backend:

```powershell
cd backend
py -m pytest -q
```

## Docker

Build:

```powershell
docker compose build
```

Run:

```powershell
docker compose up --build
```

Expected ports:

- frontend: `http://localhost:3000`
- backend docs: `http://localhost:8000/docs`
- PostgreSQL inside compose
- bot starts only when `TELEGRAM_BOT_TOKEN` is set

If port `8000` is already used by another local service, stop that service or change the backend published port in `docker-compose.yml`.

## Deployment

Suggested MVP deployment:

- Frontend: Vercel or VPS
- Backend: Railway, Render, or VPS
- PostgreSQL: managed PostgreSQL or compose-managed VPS database
- Bot: same backend host or a small worker service

Set the final HTTPS frontend URL in BotFather as the Web App URL.

## MVP Limits

- Astana only.
- Basket comparison is by one store, not split across stores.
- Product catalog is parser-backed through normalized seed files until live scheduled ingestion is enabled.
- No price history.
- No receipt scanning.
- No barcode scanning.
- No AI recommendations.
- No loyalty programs.
- No delivery distance or maps.
