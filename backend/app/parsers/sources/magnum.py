from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urljoin

import httpx

from app.parsers.base import StoreParser
from app.parsers.normalization import infer_package, normalize_price
from app.parsers.schemas import ParsedProduct


_API_BASE_URL = "https://magnum.kz:1337/api"
_ASSET_BASE_URL = "https://magnum.kz:1337"
_BARCODE_RE = re.compile(r"(?<!\d)(\d{8,14})(?!\d)")


class MagnumParser(StoreParser):
    store = "magnum"

    def __init__(self, city_id: int = 2, page_size: int = 50) -> None:
        self.city_id = city_id
        self.page_size = page_size

    async def fetch_products(self, limit: int | None = None) -> list[ParsedProduct]:
        target = limit or self.page_size
        products: list[ParsedProduct] = []
        seen: set[str] = set()
        page = 1
        async with httpx.AsyncClient(timeout=30, headers={"User-Agent": "Mozilla/5.0"}) as client:
            while len(products) < target:
                payload = await self._fetch_page(client, page, min(self.page_size, target - len(products)))
                raw_items = payload.get("data") if isinstance(payload, dict) else None
                if not raw_items:
                    break
                for item in raw_items:
                    product = _normalize_product(item)
                    if product is not None and product.external_id not in seen:
                        seen.add(product.external_id)
                        products.append(product)
                page += 1
        return products[:target]

    async def _fetch_page(self, client: httpx.AsyncClient, page: int, page_size: int) -> dict[str, Any]:
        params = {
            "pagination[page]": page,
            "pagination[pageSize]": page_size,
            "populate[image]": "*",
            "populate[category]": "*",
            "populate[club][populate]": "*",
            "filters[shops][city][id][$eq]": self.city_id,
            "sort[0]": "id:asc",
            "locale": "ru",
        }
        response = await client.get(f"{_API_BASE_URL}/products", params=params)
        response.raise_for_status()
        return response.json()


def _normalize_product(raw: dict[str, Any]) -> ParsedProduct | None:
    attributes = raw.get("attributes") if isinstance(raw, dict) else None
    if not isinstance(attributes, dict):
        return None
    external_id = str(raw.get("id") or "").strip()
    name = _text(attributes.get("name"))
    price = normalize_price(attributes.get("final_price") or attributes.get("start_price"))
    if not external_id or not name or price is None:
        return None

    old_price = normalize_price(attributes.get("start_price"))
    if old_price is not None and old_price <= price:
        old_price = None

    package_value, package_unit = infer_package(name.lower())
    category = _category_name(attributes.get("category"))
    image_url = _image_url(attributes.get("image"))
    updated_at = _parse_datetime(_text(attributes.get("updatedAt"))) or datetime.now(timezone.utc)

    return ParsedProduct(
        store="magnum",
        external_id=external_id,
        name=name,
        brand=None,
        category=category,
        image_url=image_url,
        product_url=f"https://magnum.kz/products/{external_id}",
        barcode=_barcode_from_image(image_url),
        package_value=package_value,
        package_unit=package_unit,
        price=price,
        old_price=old_price,
        in_stock=True,
        updated_at=updated_at,
        raw_data=raw,
    )


def _category_name(value: object) -> str | None:
    if not isinstance(value, dict):
        return None
    data = value.get("data")
    if not isinstance(data, dict):
        return None
    attributes = data.get("attributes")
    if not isinstance(attributes, dict):
        return None
    return _text(attributes.get("label"))


def _image_url(value: object) -> str | None:
    if not isinstance(value, dict):
        return None
    data = value.get("data")
    if isinstance(data, list):
        data = data[0] if data else None
    if not isinstance(data, dict):
        return None
    attributes = data.get("attributes")
    if not isinstance(attributes, dict):
        return None
    url = _text(attributes.get("url"))
    return urljoin(_ASSET_BASE_URL, url) if url else None


def _barcode_from_image(url: str | None) -> str | None:
    if not url:
        return None
    match = _BARCODE_RE.search(url.rsplit("/", 1)[-1])
    return match.group(1) if match else None


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _text(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None
