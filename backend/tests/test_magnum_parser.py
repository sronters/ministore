from app.parsers.sources.magnum import _normalize_product


def test_normalize_magnum_api_product() -> None:
    product = _normalize_product(
        {
            "id": 242990,
            "attributes": {
                "name": "СОУС СОЕВЫЙ 500 МЛ",
                "start_price": 929,
                "final_price": 789,
                "updatedAt": "2026-06-25T00:00:00.000Z",
                "image": {"data": [{"attributes": {"url": "/uploads/4870001084875.jpg"}}]},
                "category": {"data": {"attributes": {"label": "Бакалея"}}},
            },
        }
    )

    assert product is not None
    assert product.store == "magnum"
    assert product.external_id == "242990"
    assert product.price == 789
    assert product.old_price == 929
    assert product.barcode == "4870001084875"
    assert product.package_unit == "ml"

