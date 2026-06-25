from app.schemas.catalog import CategoryOut, ProductDetailsOut, ProductOfferOut, StoreOut
from app.services.comparison import compare_cart


small = StoreOut(id="small", name="Small")
arbuz = StoreOut(id="arbuz", name="Arbuz")
magnum = StoreOut(id="magnum", name="Magnum")
category = CategoryOut(id="dairy", name="Dairy")


def product(product_id: str, offers: list[ProductOfferOut]) -> ProductDetailsOut:
    prices = [offer.price for offer in offers if offer.inStock]
    return ProductDetailsOut(
        id=product_id,
        name=product_id,
        brand=None,
        category=category,
        imageUrl=None,
        packageValue=None,
        packageUnit=None,
        minimumPrice=min(prices),
        oldMinimumPrice=None,
        offersCount=len(offers),
        inStock=bool(prices),
        updatedAt="2026-06-25T00:00:00+00:00",
        offers=offers,
    )


def offer(product_id: str, store: StoreOut, price: int, in_stock: bool = True) -> ProductOfferOut:
    return ProductOfferOut(
        id=f"{product_id}:{store.id}",
        productId=product_id,
        store=store,
        price=price,
        oldPrice=None,
        inStock=in_stock,
        productUrl=None,
        updatedAt="2026-06-25T00:00:00+00:00",
    )


def test_best_store_prefers_complete_cart() -> None:
    products = [
        product("milk", [offer("milk", small, 400), offer("milk", arbuz, 450), offer("milk", magnum, 430)]),
        product("eggs", [offer("eggs", small, 800), offer("eggs", arbuz, 790), offer("eggs", magnum, 820)]),
        product("bread", [offer("bread", small, 200), offer("bread", arbuz, 240), offer("bread", magnum, 230)]),
    ]
    result = compare_cart([("milk", 1), ("eggs", 1), ("bread", 1)], products)

    assert result.bestStore is not None
    assert result.bestStore.complete is True
    assert result.bestStore.store.id == "small"


def test_incomplete_store_is_not_best_when_complete_exists() -> None:
    products = [
        product("bread", [offer("bread", small, 220), offer("bread", magnum, 100, in_stock=False)]),
        product("detergent", [offer("detergent", small, 3500), offer("detergent", magnum, 3000, in_stock=False)]),
    ]
    result = compare_cart([("bread", 1), ("detergent", 1)], products)

    assert result.bestStore is not None
    assert result.bestStore.store.id != "magnum"
