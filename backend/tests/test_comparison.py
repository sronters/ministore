from app.repositories.mock_catalog import MockCatalogRepository
from app.services.comparison import compare_cart


def test_best_store_prefers_complete_cart() -> None:
    repo = MockCatalogRepository()
    products = repo.batch(["product_001", "product_002", "product_003"])
    result = compare_cart([("product_001", 1), ("product_002", 1), ("product_003", 1)], products)

    assert result.bestStore is not None
    assert result.bestStore.complete is True
    assert result.bestStore.store.id == "small"


def test_incomplete_store_is_not_best_when_complete_exists() -> None:
    repo = MockCatalogRepository()
    products = repo.batch(["product_003", "product_006"])
    result = compare_cart([("product_003", 1), ("product_006", 1)], products)

    assert result.bestStore is not None
    assert result.bestStore.store.id != "magnum"
