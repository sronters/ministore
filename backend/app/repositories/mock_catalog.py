from copy import deepcopy
from difflib import SequenceMatcher

from app.schemas.catalog import CategoryOut, ProductDetailsOut, ProductOfferOut, ProductOut, StoreOut

stores = [
    StoreOut(id="small", name="Small"),
    StoreOut(id="arbuz", name="Arbuz"),
    StoreOut(id="magnum", name="Magnum"),
]

categories = [
    CategoryOut(id="dairy", name="Молочные продукты"),
    CategoryOut(id="bread", name="Хлеб"),
    CategoryOut(id="eggs", name="Яйца"),
    CategoryOut(id="drinks", name="Напитки"),
    CategoryOut(id="grocery", name="Бакалея"),
    CategoryOut(id="sweets", name="Сладости"),
    CategoryOut(id="meat", name="Мясо"),
    CategoryOut(id="household", name="Бытовые товары"),
]


def _offer(product_id: str, store_id: str, price: int, old_price: int | None, in_stock: bool) -> ProductOfferOut:
    store = next(item for item in stores if item.id == store_id)
    return ProductOfferOut(
        id=f"{product_id}_{store_id}",
        productId=product_id,
        store=store,
        price=price,
        oldPrice=old_price,
        inStock=in_stock,
        productUrl=f"https://{store_id}.kz/products/{product_id}" if in_stock else None,
        updatedAt="2026-06-22T14:30:00+05:00",
    )


def _product(
    product_id: str,
    name: str,
    brand: str | None,
    category: CategoryOut,
    package_value: float | None,
    package_unit: str | None,
    offers: list[ProductOfferOut],
) -> ProductDetailsOut:
    available = [offer for offer in offers if offer.inStock]
    prices = [offer.price for offer in available]
    old_prices = [offer.oldPrice for offer in available if offer.oldPrice is not None]
    return ProductDetailsOut(
        id=product_id,
        name=name,
        brand=brand,
        category=category,
        imageUrl=None,
        packageValue=package_value,
        packageUnit=package_unit,
        minimumPrice=min(prices),
        oldMinimumPrice=min(old_prices) if old_prices else None,
        offersCount=len(offers),
        inStock=bool(available),
        updatedAt=available[0].updatedAt,
        offers=offers,
    )


products = [
    _product("product_001", "Молоко FoodMaster 2.5%, 1 л", "FoodMaster", categories[0], 1, "l", [_offer("product_001", "small", 489, 529, True), _offer("product_001", "arbuz", 549, None, True), _offer("product_001", "magnum", 505, 535, True)]),
    _product("product_002", "Яйца Казгер-Кус C1, 10 шт.", "Казгер-Кус", categories[2], 10, "pcs", [_offer("product_002", "small", 829, 899, True), _offer("product_002", "arbuz", 799, 849, True), _offer("product_002", "magnum", 845, None, True)]),
    _product("product_003", "Хлеб пшеничный, 500 г", "Аксай", categories[1], 500, "g", [_offer("product_003", "small", 229, None, True), _offer("product_003", "arbuz", 255, None, True), _offer("product_003", "magnum", 219, None, False)]),
    _product("product_004", "Куриное филе охлаждённое, 1 кг", "Приосколье", categories[6], 1, "kg", [_offer("product_004", "small", 2890, None, True), _offer("product_004", "arbuz", 3120, None, True), _offer("product_004", "magnum", 2760, 2990, True)]),
    _product("product_005", "Coca-Cola Original, 1 л", "Coca-Cola", categories[3], 1, "l", [_offer("product_005", "small", 479, 529, True), _offer("product_005", "arbuz", 499, None, True), _offer("product_005", "magnum", 459, 499, True)]),
    _product("product_006", "Стиральный порошок Persil, 3 кг", "Persil", categories[7], 3, "kg", [_offer("product_006", "small", 3890, 4290, True), _offer("product_006", "arbuz", 4050, None, True), _offer("product_006", "magnum", 3790, None, False)]),
]


def _summary(product: ProductDetailsOut) -> ProductOut:
    data = product.model_dump()
    data.pop("offers")
    return ProductOut(**data)


class MockCatalogRepository:
    def search(
        self,
        q: str = "",
        page: int = 1,
        limit: int = 20,
        category_id: str | None = None,
        brand: str | None = None,
        store_id: str | None = None,
        in_stock_only: bool = False,
        sort: str = "relevance",
    ) -> tuple[list[ProductOut], int]:
        query = q.lower().replace("ё", "е").strip()
        filtered = []
        for product in products:
            searchable = f"{product.name} {product.brand or ''} {product.category.name}".lower().replace("ё", "е")
            fuzzy = not query or query in searchable or SequenceMatcher(None, query, searchable).ratio() > 0.45
            if not fuzzy:
                continue
            if category_id and product.category.id != category_id:
                continue
            if brand and brand.lower() not in (product.brand or "").lower():
                continue
            if store_id and not any(offer.store.id == store_id and offer.inStock for offer in product.offers):
                continue
            if in_stock_only and not product.inStock:
                continue
            filtered.append(product)
        if sort == "price_asc":
            filtered.sort(key=lambda item: item.minimumPrice)
        start = (page - 1) * limit
        return [_summary(item) for item in filtered[start : start + limit]], len(filtered)

    def get(self, product_id: str) -> ProductDetailsOut | None:
        found = next((item for item in products if item.id == product_id), None)
        return deepcopy(found) if found else None

    def batch(self, product_ids: list[str]) -> list[ProductDetailsOut]:
        ids = set(product_ids)
        return [deepcopy(item) for item in products if item.id in ids]

    def categories(self) -> list[CategoryOut]:
        return categories

    def stores(self) -> list[StoreOut]:
        return stores
