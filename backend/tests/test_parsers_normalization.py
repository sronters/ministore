from app.parsers.normalization import infer_package, normalize_name, normalize_price


def test_normalize_price_accepts_kazakhstan_formats() -> None:
    assert normalize_price("1 299 ₸") == 1299
    assert normalize_price("489 тг") == 489
    assert normalize_price("529,00") == 529


def test_infer_package_from_product_name() -> None:
    assert infer_package("Молоко FoodMaster 2.5%, 1 л") == (1.0, "l")
    assert infer_package("Хлеб пшеничный 500 г") == (500.0, "g")
    assert infer_package("Яйца C1 10 шт") == (10.0, "pcs")
    assert infer_package("Картофель молодой Узбекистан кг") == (1.0, "kg")


def test_normalize_name_collapses_spaces_and_yo() -> None:
    assert normalize_name("  Молоко   сгущённое  ") == "Молоко сгущенное"
