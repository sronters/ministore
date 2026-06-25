from app.parsers.sources.small import parse_small_discount_snapshot


def test_parse_small_discount_snapshot() -> None:
    products = parse_small_discount_snapshot(
        """
        -20%
        Майонез 3 ЖЕЛАНИЯ Салатный 420г
        Купить
        650 ₸ 520 ₸
        """
    )

    assert len(products) == 1
    assert products[0].store == "small"
    assert products[0].price == 520
    assert products[0].old_price == 650
    assert products[0].package_value == 420
    assert products[0].package_unit == "g"
