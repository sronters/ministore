from __future__ import annotations

import html
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

from app.parsers.base import StoreParser
from app.parsers.normalization import infer_package, normalize_price
from app.parsers.schemas import ParsedProduct

_PRODUCT_ATTR_RE = re.compile(r':product="(?P<payload>[^"]+)"')
_COLLECTION_ATTR_RE = re.compile(r':collection="(?P<payload>[^"]+)"')
_IMAGE_BARCODE_RE = re.compile(r"(?<!\d)(\d{12,14})(?!\d)")
_BASE_URL = "https://arbuz.kz"


class ArbuzParser(StoreParser):
    store = "arbuz"

    def __init__(self, html_paths: list[Path] | None = None, city: str = "astana") -> None:
        self.html_paths = html_paths or []
        self.city = city

    async def fetch_products(self, limit: int | None = None) -> list[ParsedProduct]:
        if not self.html_paths:
            raise NotImplementedError(
                "Pass html_paths for captured Arbuz HTML. Live HTTP fetching is intentionally separate from extraction."
            )
        products: list[ParsedProduct] = []
        seen: set[str] = set()
        for html_path in self.html_paths:
            for product in parse_arbuz_html(html_path.read_text(encoding="utf-8"), city=self.city):
                if product.external_id in seen:
                    continue
                seen.add(product.external_id)
                products.append(product)
        return products[:limit] if limit is not None else products


def parse_arbuz_html(source: str, city: str = "astana", fetched_at: datetime | None = None) -> list[ParsedProduct]:
    fetched_at = fetched_at or datetime.now(timezone.utc)
    raw_products = _extract_raw_products(source)
    parsed: list[ParsedProduct] = []
    seen: set[str] = set()
    for raw in raw_products:
        normalized = _normalize_raw_product(raw, city=city, fetched_at=fetched_at)
        if normalized is None or normalized.external_id in seen:
            continue
        seen.add(normalized.external_id)
        parsed.append(normalized)
    return parsed


def _extract_raw_products(source: str) -> list[dict]:
    products: list[dict] = []
    for match in _PRODUCT_ATTR_RE.finditer(source):
        product = _loads_html_json(match.group("payload"))
        if isinstance(product, dict):
            products.append(product)

    for match in _COLLECTION_ATTR_RE.finditer(source):
        collection = _loads_html_json(match.group("payload"))
        if isinstance(collection, dict):
            collection_products = collection.get("products")
            if isinstance(collection_products, list):
                products.extend(item for item in collection_products if isinstance(item, dict))
    return products


def _loads_html_json(payload: str) -> object | None:
    try:
        return json.loads(html.unescape(payload))
    except json.JSONDecodeError:
        return None


def _normalize_raw_product(raw: dict, city: str, fetched_at: datetime) -> ParsedProduct | None:
    external_id = _text(raw.get("id"))
    name = _text(raw.get("name"))
    price = normalize_price(raw.get("priceActual", raw.get("price_actual")))
    if not external_id or not name or price is None:
        return None

    old_price = normalize_price(raw.get("pricePrevious", raw.get("price_previous")))
    if old_price is not None and old_price <= price:
        old_price = None

    package_value, package_unit = infer_package(name)
    if package_value is None or package_unit is None:
        package_value, package_unit = infer_package(_text(raw.get("weight")) or "")
    category = _text(raw.get("catalogName")) or _category_from_additional_info(raw)
    updated_at = _parse_datetime(_text(raw.get("updated_at"))) or fetched_at
    product_url = _product_url(raw, city)

    return ParsedProduct(
        store="arbuz",
        external_id=external_id,
        name=name,
        brand=_text(raw.get("brandName", raw.get("brand_name"))),
        category=category,
        image_url=_image_url(raw.get("image")),
        product_url=product_url,
        barcode=_barcode(raw),
        package_value=package_value,
        package_unit=package_unit,
        price=price,
        old_price=old_price,
        in_stock=_is_in_stock(raw, price),
        updated_at=updated_at,
        raw_data=raw,
    )


def _is_in_stock(raw: dict, price: int) -> bool:
    if raw.get("isAvailable") is not None:
        return bool(raw["isAvailable"]) and price > 0
    warehouse_quantity = _float_or_none(raw.get("warehouse_quantity"))
    if warehouse_quantity is not None:
        return warehouse_quantity > 0 and price > 0
    return price > 0 and not bool(raw.get("is_stopped"))


def _image_url(value: object) -> str | None:
    image = _text(value)
    if not image:
        return None
    image = image.replace("%w", "360").replace("%h", "360")
    if image.startswith("http"):
        return image
    return f"{_BASE_URL}/image/s3/arbuz-kz-products/{image}?w=360&h=360"


def _barcode(raw: dict) -> str | None:
    explicit = _text(raw.get("barcode"))
    if explicit:
        return explicit
    article_index = _text(raw.get("articleIndex", raw.get("article_index")))
    if article_index:
        return article_index
    image = _text(raw.get("image"))
    if image:
        match = _IMAGE_BARCODE_RE.search(image.split("?", 1)[0])
        if match:
            return match.group(1)
    return None


def _product_url(raw: dict, city: str) -> str | None:
    uri = _text(raw.get("uri"))
    if uri:
        return urljoin(_BASE_URL, uri)
    external_id = _text(raw.get("id"))
    if not external_id:
        return None
    return f"{_BASE_URL}/ru/{city}/catalog/item/{external_id}"


def _category_from_additional_info(raw: dict) -> str | None:
    additional = raw.get("additionalInformation")
    if not isinstance(additional, dict):
        return None
    return _text(additional.get("categoryLevel3")) or _text(additional.get("categoryLevel2")) or _text(additional.get("categoryLevel1"))


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S%z"):
        try:
            parsed = datetime.strptime(value, fmt)
        except ValueError:
            continue
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=timezone.utc)
        return parsed
    return None


def _text(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _float_or_none(value: object) -> float | None:
    if value is None:
        return None
    try:
        return float(str(value).replace(",", "."))
    except ValueError:
        return None
