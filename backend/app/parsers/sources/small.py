from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import Path

from app.parsers.base import StoreParser
from app.parsers.normalization import infer_package, normalize_price
from app.parsers.schemas import ParsedProduct

_DISCOUNT_RE = re.compile(r"^-\d+%$")
_PRICE_RE = re.compile(r"(?P<old>\d+(?:[.,]\d+)?)\s*₸\s*(?P<price>\d+(?:[.,]\d+)?)\s*₸")


class SmallParser(StoreParser):
    store = "small"

    def __init__(self, snapshot_paths: list[Path] | None = None) -> None:
        self.snapshot_paths = snapshot_paths or []

    async def fetch_products(self, limit: int | None = None) -> list[ParsedProduct]:
        if not self.snapshot_paths:
            raise NotImplementedError("Small.kz blocks server-side requests; pass saved discount snapshot text files.")
        products: list[ParsedProduct] = []
        for path in self.snapshot_paths:
            products.extend(parse_small_discount_snapshot(path.read_text(encoding="utf-8")))
        return products[:limit] if limit is not None else products


def parse_small_discount_snapshot(source: str, fetched_at: datetime | None = None) -> list[ParsedProduct]:
    fetched_at = fetched_at or datetime.now(timezone.utc)
    lines = [line.strip() for line in source.splitlines() if line.strip()]
    products: list[ParsedProduct] = []
    seen: set[str] = set()
    for index, line in enumerate(lines):
        if not _DISCOUNT_RE.match(line):
            continue
        if index + 3 >= len(lines) or lines[index + 2].lower() != "купить":
            continue
        name = lines[index + 1]
        price_match = _PRICE_RE.search(lines[index + 3])
        if price_match is None:
            continue
        price = normalize_price(price_match.group("price"))
        old_price = normalize_price(price_match.group("old"))
        if price is None:
            continue
        if old_price is not None and old_price <= price:
            old_price = None
        external_id = _external_id(name)
        if external_id in seen:
            continue
        seen.add(external_id)
        package_value, package_unit = infer_package(name.lower())
        products.append(
            ParsedProduct(
                store="small",
                external_id=external_id,
                name=name,
                brand=None,
                category=_infer_category(name),
                image_url=None,
                product_url="https://daily.nedostavka.net/ru/almaty/discounts/store/small",
                barcode=None,
                package_value=package_value,
                package_unit=package_unit,
                price=price,
                old_price=old_price,
                in_stock=True,
                updated_at=fetched_at,
                raw_data={"source": "daily.nedostavka.net"},
            )
        )
    return products


def _external_id(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:80]


def _infer_category(name: str) -> str:
    lowered = name.lower()
    if any(word in lowered for word in ("шоколад", "печенье", "конфет")):
        return "Сладости"
    if any(word in lowered for word in ("вода", "напиток", "чай", "кофе")):
        return "Напитки"
    if any(word in lowered for word in ("шампунь", "крем", "гель", "паста", "дезодорант", "брить")):
        return "Гигиена и уход"
    if any(word in lowered for word in ("блок", "мыло", "средство")):
        return "Бытовая химия"
    return "Продукты"
