from datetime import datetime, timezone

from app.parsers.quality import barcode_intersections, build_quality_report
from app.parsers.schemas import ParsedProduct


def _product(store: str, external_id: str, barcode: str | None = "4870000000000") -> ParsedProduct:
    return ParsedProduct(
        store=store,
        external_id=external_id,
        name="Молоко FoodMaster 2.5%, 1 л",
        brand="FoodMaster",
        category="Молочные продукты",
        barcode=barcode,
        package_value=1,
        package_unit="l",
        price=489,
        old_price=529,
        in_stock=True,
        updated_at=datetime.now(timezone.utc),
    )


def test_quality_report_flags_duplicate_external_ids() -> None:
    products = [_product("arbuz", "1"), _product("arbuz", "1")]
    report = build_quality_report("arbuz", products)

    assert report.has_errors is True
    assert report.duplicate_external_ids == ["1"]


def test_barcode_intersections_require_multiple_stores() -> None:
    products = [_product("arbuz", "1"), _product("small", "2"), _product("arbuz", "3", "123")]
    intersections = barcode_intersections(products)

    assert list(intersections) == ["4870000000000"]
    assert {item.store for item in intersections["4870000000000"]} == {"arbuz", "small"}
