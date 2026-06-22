# MinBasket: техническое описание проекта

MinBasket — временное рабочее название Telegram Mini App для сравнения стоимости продуктовой корзины в магазинах Астаны. Проект разделён так, чтобы Mini App уже работал на mock-данных, а реальный каталог товаров и цен можно было подключить позже через зафиксированный API-контракт.

## 1. Цель MVP

Пользовательский сценарий MVP:

1. Пользователь открывает Telegram-бота.
2. Нажимает кнопку открытия Mini App.
3. Ищет товар.
4. Открывает карточку товара.
5. Видит цены в разных магазинах.
6. Добавляет товары в корзину.
7. Меняет количество товаров.
8. Сравнивает корзину между магазинами.
9. Видит лучший магазин, отсутствующие товары и экономию.
10. Возвращается позже и видит сохранённую корзину.

Ограничения MVP:

- город только Астана;
- сравнение корзины только в рамках одного магазина;
- без распределения товаров между несколькими магазинами;
- без истории цен;
- без AI-рекомендаций;
- без карт, доставки и расстояний;
- без сканирования чеков и штрихкодов;
- без программы лояльности.

## 2. Архитектура

```text
Telegram Bot
  -> Telegram Mini App
  -> Frontend API client
  -> Mock provider или FastAPI backend
  -> PostgreSQL для пользователей и корзин
  -> внешний каталог/парсер товаров в будущем
```

### Frontend

Frontend находится в `src/`.

Основные зоны:

- `src/app` — Next.js App Router routes.
- `src/components` — общие UI-компоненты.
- `src/features/products` — каталог, поиск, карточка товара.
- `src/features/cart` — корзина.
- `src/features/comparison` — расчёт и экран сравнения.
- `src/features/categories` — категории.
- `src/lib/api` — API abstraction layer.
- `src/lib/telegram` — Telegram Web Apps SDK wrapper.
- `src/mocks` — mock catalog data.
- `src/stores` — Zustand state.
- `src/types` — доменные типы.
- `src/config/app.ts` — runtime branding/config для frontend.

Frontend-компоненты не импортируют mock-данные напрямую. Вся работа с данными идёт через `src/lib/api/client.ts`.

### Backend

Backend находится в `backend/`.

Основные зоны:

- `backend/app/main.py` — FastAPI app.
- `backend/app/api` — REST routes и dependencies.
- `backend/app/core` — env config и утилиты.
- `backend/app/db` — SQLAlchemy session/base.
- `backend/app/models` — User, Cart, CartItem.
- `backend/app/repositories` — user repository и mock catalog repository.
- `backend/app/schemas` — Pydantic DTO.
- `backend/app/services` — JWT и сравнение корзины.
- `backend/app/telegram` — проверка Telegram initData.
- `backend/app/bot.py` — aiogram bot.
- `backend/alembic` — миграции БД.
- `backend/tests` — pytest tests.

Backend уже умеет хранить пользователей и корзины. Каталог товаров сейчас mock-backed, потому что реальный парсер/каталог должен подключаться отдельной стороной.

## 3. Технологический стек

Frontend:

- Next.js 16 App Router;
- TypeScript strict mode;
- Tailwind CSS;
- Geist Sans;
- Lucide Icons;
- TanStack Query;
- Zustand;
- React Hook Form;
- Zod;
- Vitest.

Backend:

- FastAPI;
- Pydantic;
- SQLAlchemy 2 async;
- Alembic;
- PostgreSQL;
- JWT;
- aiogram 3;
- pytest.

Infrastructure:

- Docker Compose;
- отдельный Dockerfile для frontend;
- отдельный Dockerfile для backend;
- отдельный Dockerfile для bot;
- PostgreSQL volume;
- healthchecks.

## 4. Runtime-конфигурация и брендинг

Название продукта временное. Оно не должно быть захардкожено в компонентах.

Основные переменные:

```env
APP_NAME=MinBasket
APP_DESCRIPTION=Сравнение цен на продукты
NEXT_PUBLIC_APP_NAME=MinBasket
NEXT_PUBLIC_APP_DESCRIPTION=Сравнение цен на продукты
TELEGRAM_BOT_USERNAME=
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=
NEXT_PUBLIC_ACCENT_COLOR=#2AABEE
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_USE_MOCK_API=true
```

Что можно поменять без переписывания бизнес-логики:

- название продукта;
- короткое описание;
- username Telegram-бота;
- домен frontend;
- API URL;
- цвет акцента.

Frontend config: `src/config/app.ts`.

Backend config: `backend/app/core/config.py`.

## 5. Telegram-интеграция

Frontend:

- подключает официальный script `https://telegram.org/js/telegram-web-app.js`;
- вызывает `Telegram.WebApp.ready()`;
- вызывает `Telegram.WebApp.expand()`;
- использует BackButton на вложенных экранах;
- использует MainButton на корзине;
- использует haptic feedback при добавлении товара;
- в обычном браузере использует безопасный mock Telegram environment.

Важно: frontend не доверяет `initDataUnsafe` для авторизации. Он может использовать `initDataUnsafe.user.first_name` только для отображения приветствия. Авторизация делается через полный `initData`, отправленный на backend.

Backend:

- принимает `POST /api/v1/auth/telegram`;
- проверяет подпись Telegram initData по официальному HMAC-алгоритму;
- проверяет `auth_date`;
- создаёт или обновляет пользователя;
- возвращает access token.

## 6. API-контракт

Frontend ожидает такие endpoints:

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

### Product

```ts
interface Product {
  id: string;
  name: string;
  brand: string | null;
  category: {
    id: string;
    name: string;
  };
  imageUrl: string | null;
  packageValue: number | null;
  packageUnit: "g" | "kg" | "ml" | "l" | "pcs" | null;
  minimumPrice: number;
  oldMinimumPrice: number | null;
  offersCount: number;
  inStock: boolean;
  updatedAt: string;
}
```

### ProductOffer

```ts
interface ProductOffer {
  id: string;
  productId: string;
  store: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  price: number;
  oldPrice: number | null;
  inStock: boolean;
  productUrl: string | null;
  updatedAt: string;
}
```

### CartItem

```ts
interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}
```

### StoreComparison

```ts
interface StoreComparison {
  store: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  total: number;
  availableItemsCount: number;
  totalItemsCount: number;
  complete: boolean;
  missingItems: Array<{
    productId: string;
    name: string;
  }>;
  differenceFromBest: number | null;
}
```

## 7. Логика сравнения корзины

Для каждого магазина:

1. Найти предложение каждого товара.
2. Проверить `inStock`.
3. Умножить `price * quantity`.
4. Посчитать сумму.
5. Посчитать доступные позиции.
6. Собрать отсутствующие позиции.
7. Определить, полная корзина или нет.

Выбор лучшего магазина:

1. Сначала рассматриваются только магазины, где есть вся корзина.
2. Среди полных магазинов выбирается минимальная сумма.
3. Если полных магазинов нет, выбирается магазин с максимальным количеством доступных позиций.
4. При равном количестве доступных позиций выбирается меньшая сумма доступных товаров.
5. Экономия не показывается как полноценная, если корзины неполные.

Frontend implementation: `src/features/comparison/lib/calculate-comparison.ts`.

Backend implementation: `backend/app/services/comparison.py`.

## 8. Что уже реализовано

Frontend:

- главная страница;
- поиск;
- каталог;
- фильтры;
- карточка товара;
- добавление в корзину;
- изменение количества;
- удаление товара;
- persisted cart;
- экран сравнения корзины;
- Telegram SDK wrapper;
- mock API provider;
- remote API mode;
- loading/error/empty states;
- mobile-first UI.

Backend:

- Telegram auth endpoint;
- проверка Telegram initData;
- JWT access token;
- модели User, Cart, CartItem;
- CRUD корзины;
- mock catalog repository;
- поиск;
- карточка товара;
- batch endpoint;
- comparison endpoint;
- healthcheck;
- Alembic migration;
- tests.

Bot:

- `/start`;
- `/app`;
- `/help`;
- Web App button.

Docker:

- frontend service;
- backend service;
- bot service;
- postgres service;
- healthchecks;
- startup order.

## 9. Что нужно от другой стороны проекта

Другая сторона отвечает за реальный товарный каталог, парсеры и качество данных.

### 9.1 Источники данных

Нужно исследовать и подключить минимум два стабильных источника:

- Arbuz;
- один из Small, Magnum, Airba или другой технически доступный источник.

Для каждого источника нужно выяснить:

- как получить каталог;
- есть ли JSON/API;
- как работает пагинация;
- как выбирается город Астана;
- какие поля доступны;
- как определяется наличие;
- есть ли старые цены;
- есть ли штрихкод;
- есть ли прямой URL товара;
- как часто можно обновлять данные без блокировок.

### 9.2 Единый формат сырых товаров

Парсеры должны приводить товары к формату:

```json
{
  "external_id": "12345",
  "name": "Молоко FoodMaster 2.5% 1 л",
  "brand": "FoodMaster",
  "category": "Молочные продукты",
  "image_url": "https://store.kz/image.jpg",
  "product_url": "https://store.kz/product/12345",
  "barcode": "4870000000000",
  "package_value": 1,
  "package_unit": "l",
  "price": 489,
  "old_price": 529,
  "in_stock": true,
  "updated_at": "2026-06-23T12:30:00+05:00"
}
```

Требования:

- цены только числами;
- даты только ISO 8601;
- package units только `g`, `kg`, `ml`, `l`, `pcs`;
- stable external ID внутри магазина;
- stable общий product ID после matching;
- `in_stock` должен быть boolean;
- `old_price` должен быть `null`, если скидки нет.

### 9.3 Matching одинаковых товаров

Нужно сделать слой, который объединяет одинаковые товары из разных магазинов в общий `Product`.

Минимальные правила MVP:

1. Если совпал barcode — это один товар.
2. Если barcode отсутствует, сравнивать:
   - бренд;
   - вес или объём;
   - тип товара;
   - похожесть названия.
3. Сомнительные пары отправлять на ручную проверку.

Результат matching должен давать стабильный `product.id`, который frontend и cart могут хранить как `external_product_id`.

### 9.4 API, который должна дать другая сторона

Нужно предоставить совместимый API:

```http
GET /api/v1/products/search?q=молоко&page=1&limit=20
GET /api/v1/products/{product_id}
GET /api/v1/categories
GET /api/v1/stores
POST /api/v1/products/batch
```

`POST /api/v1/products/batch` критичен для корзины: frontend/backend должны по списку product IDs получить актуальные предложения всех товаров.

### 9.5 Качество данных

Нужно обеспечить:

- минимум 1000 реальных товаров для MVP;
- 5-8 категорий;
- достаточное пересечение товаров между магазинами;
- регулярное обновление цен;
- логирование ошибок парсеров;
- явный `updated_at` для каждого offer;
- понятное поведение, если товар исчез из магазина;
- понятное поведение, если цена устарела.

### 9.6 Интеграционные договорённости

Перед интеграцией нужно согласовать:

- base URL API;
- версию `/api/v1`;
- формат ошибок;
- CORS origins;
- auth между сервисами, если каталог закрытый;
- rate limits;
- timezone;
- currency;
- правила устаревания цен;
- правила наличия;
- стабильность product IDs.

## 10. Локальный запуск

Frontend:

```powershell
npm.cmd install
npm.cmd run dev
```

Backend:

```powershell
py -m pip install -r backend\requirements.txt
cd backend
py -m uvicorn app.main:app --reload --port 8000
```

Docker:

```powershell
docker compose up --build
```

Если порт `8000` занят, нужно освободить его или поменять published port backend в `docker-compose.yml`.

## 11. Проверки

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

Docker:

```powershell
docker compose config
docker compose build
```

## 12. Безопасность и секреты

В репозиторий нельзя коммитить:

- `.env`;
- реальные Telegram bot tokens;
- реальные JWT secrets;
- реальные database passwords;
- production credentials;
- дампы БД;
- логи с персональными данными.

В репозитории должен быть только `.env.example` с пустыми секретными значениями.

Telegram user ID нельзя принимать из frontend body без проверки `initData`.

## 13. Критерий готовности интеграции

Интеграция с реальным каталогом считается готовой, когда:

1. `NEXT_PUBLIC_USE_MOCK_API=false`.
2. Поиск возвращает реальные товары.
3. Карточка товара возвращает реальные offers.
4. Batch endpoint возвращает все товары корзины.
5. Корзина сравнивается минимум по двум магазинам.
6. У каждого offer есть `updatedAt`.
7. Отсутствующие товары корректно попадают в `missingItems`.
8. Лучший магазин не выбирается из неполной корзины, если есть полный магазин.
