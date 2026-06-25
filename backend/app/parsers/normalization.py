from __future__ import annotations

import re
from decimal import Decimal, InvalidOperation

from app.parsers.schemas import PackageUnit

_SPACE_RE = re.compile(r"\s+")
_PACKAGE_RE = re.compile(
    r"(?P<value>\d+(?:[,.]\d+)?)\s*(?P<unit>кг|kg|г|g|л|l|литр|литра|мл|ml|шт|штук|pcs)\b",
    re.IGNORECASE,
)
_UNIT_ONLY_RE = re.compile(r"\b(?P<unit>кг|kg|шт|pcs)\b", re.IGNORECASE)

_UNIT_MAP: dict[str, PackageUnit] = {
    "г": "g",
    "g": "g",
    "кг": "kg",
    "kg": "kg",
    "мл": "ml",
    "ml": "ml",
    "л": "l",
    "l": "l",
    "литр": "l",
    "литра": "l",
    "шт": "pcs",
    "штук": "pcs",
    "pcs": "pcs",
}


def normalize_name(value: str) -> str:
    """Normalize display text for stable matching and duplicate checks."""
    value = value.replace("ё", "е").replace("Ё", "Е")
    value = value.replace("−", "-").replace("–", "-")
    return _SPACE_RE.sub(" ", value).strip()


def normalize_price(value: str | int | float | Decimal | None) -> int | None:
    if value is None:
        return None
    if isinstance(value, str):
        cleaned = value.replace("\xa0", " ").replace("₸", "").replace("тг", "")
        cleaned = cleaned.replace(" ", "").replace(",", ".")
    else:
        cleaned = str(value)
    try:
        price = Decimal(cleaned)
    except InvalidOperation:
        return None
    if price <= 0:
        return None
    return int(price.quantize(Decimal("1")))


def infer_package(name: str) -> tuple[float | None, PackageUnit | None]:
    match = _PACKAGE_RE.search(name)
    if match is None:
        unit_match = _UNIT_ONLY_RE.search(name)
        if unit_match is None:
            return None, None
        return 1.0, _UNIT_MAP[unit_match.group("unit").lower()]
    raw_value = match.group("value").replace(",", ".")
    raw_unit = match.group("unit").lower()
    unit = _UNIT_MAP[raw_unit]
    value = float(raw_value)
    return value, unit


def normalize_brand(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = normalize_name(value)
    return normalized or None
