from __future__ import annotations

import json
import re
from copy import deepcopy
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path
from typing import Iterable

from app.parsers.schemas import ParsedProduct
from app.schemas.catalog import CategoryOut, ProductDetailsOut, ProductOfferOut, ProductOut, StoreOut


STORE_NAMES = {
    "arbuz": "Arbuz",
    "small": "Small",
    "magnum": "Magnum",
    "airba": "Airba",
}

DEFAULT_CATALOG_PATHS = (
    Path(__file__).resolve().parents[3] / "data" / "arbuz_live_products.json",
    Path(__file__).resolve().parents[3] / "data" / "magnum_live_products.json",
    Path(__file__).resolve().parents[3] / "data" / "small_live_products.json",
    Path(__file__).resolve().parents[3] / "data" / "arbuz_astana_products.json",
    Path(__file__).resolve().parents[3] / "data" / "arbuz_almaty_combined_products.json",
)

_NON_SLUG_RE = re.compile(r"[^a-z0-9]+")


@dataclass(frozen=True)
class CatalogConfig:
    paths: tuple[Path, ...] = DEFAULT_CATALOG_PATHS


def _clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    text = value.strip()
    if not text:
        return None
    try:
        fixed = text.encode("cp1251").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return text
    return fixed if fixed.count("�") == 0 else text


def _slug(value: str) -> str:
    normalized = value.lower().replace("ё", "е")
    translit = normalized.translate(
        str.maketrans(
            {
                "а": "a",
                "б": "b",
                "в": "v",
                "г": "g",
                "д": "d",
                "е": "e",
                "ж": "zh",
                "з": "z",
                "и": "i",
                "й": "y",
                "к": "k",
                "л": "l",
                "м": "m",
                "н": "n",
                "о": "o",
                "п": "p",
                "р": "r",
                "с": "s",
                "т": "t",
                "у": "u",
                "ф": "f",
                "х": "h",
                "ц": "c",
                "ч": "ch",
                "ш": "sh",
                "щ": "sch",
                "ы": "y",
                "э": "e",
                "ю": "yu",
                "я": "ya",
            }
        )
    )
    return _NON_SLUG_RE.sub("-", translit).strip("-") or "category"


def _search_text(product: ProductDetailsOut) -> str:
    return " ".join(
        part.lower().replace("ё", "е")
        for part in (product.name, product.brand or "", product.category.name)
        if part
    )


def _summary(product: ProductDetailsOut) -> ProductOut:
    data = product.model_dump()
    data.pop("offers")
    return ProductOut(**data)


class CatalogRepository:
    def __init__(self, config: CatalogConfig | None = None) -> None:
        self.config = config or CatalogConfig()
        self._products = self._load_products()
        self._categories = self._build_categories(self._products)
        self._stores = self._build_stores(self._products)

    def search(
        self,
        q: str = "",
        page: int = 1,
        limit: int = 20,
        category_id: str | None = None,
        brand: str | None = None,
        store_id: str | None = None,
        in_stock_only: bool = False,
        sort: str = "relevance",
    ) -> tuple[list[ProductOut], int]:
        query = q.lower().replace("ё", "е").strip()
        filtered: list[ProductDetailsOut] = []
        for product in self._products:
            searchable = _search_text(product)
            if query and query not in searchable and SequenceMatcher(None, query, searchable).ratio() <= 0.35:
                continue
            if category_id and product.category.id != category_id:
                continue
            if brand and brand.lower() not in (product.brand or "").lower():
                continue
            if store_id and not any(offer.store.id == store_id and offer.inStock for offer in product.offers):
                continue
            if in_stock_only and not product.inStock:
                continue
            filtered.append(product)

        if sort == "price_asc":
            filtered.sort(key=lambda item: item.minimumPrice)
        elif sort == "price_desc":
            filtered.sort(key=lambda item: item.minimumPrice, reverse=True)
        elif sort == "updated_desc":
            filtered.sort(key=lambda item: item.updatedAt, reverse=True)

        start = (page - 1) * limit
        return [_summary(item) for item in filtered[start : start + limit]], len(filtered)

    def get(self, product_id: str) -> ProductDetailsOut | None:
        found = next((item for item in self._products if item.id == product_id), None)
        return deepcopy(found) if found else None

    def batch(self, product_ids: list[str]) -> list[ProductDetailsOut]:
        ids = set(product_ids)
        return [deepcopy(item) for item in self._products if item.id in ids]

    def categories(self) -> list[CategoryOut]:
        return list(self._categories)

    def stores(self) -> list[StoreOut]:
        return list(self._stores)

    def _load_products(self) -> list[ProductDetailsOut]:
        parsed = list(self._read_catalog_files())
        categories_by_name = {
            product.category or "Other": CategoryOut(id=_slug(product.category or "Other"), name=product.category or "Other")
            for product in parsed
        }
        products = [self._to_product(product, categories_by_name) for product in parsed]
        products.sort(key=lambda item: (item.category.name, item.name))
        return products

    def _read_catalog_files(self) -> Iterable[ParsedProduct]:
        seen: set[tuple[str, str]] = set()
        for path in self.config.paths:
            if not path.exists():
                continue
            payload = json.loads(path.read_text(encoding="utf-8"))
            items = payload["items"] if isinstance(payload, dict) and "items" in payload else payload
            for item in items:
                product = ParsedProduct.model_validate(item)
                key = (product.store, product.external_id)
                if key in seen:
                    continue
                seen.add(key)
                yield product.model_copy(
                    update={
                        "name": _clean_text(product.name) or product.name,
                        "brand": _clean_text(product.brand),
                        "category": _clean_text(product.category) or "Other",
                    }
                )

    def _to_product(self, product: ParsedProduct, categories_by_name: dict[str, CategoryOut]) -> ProductDetailsOut:
        product_id = f"{product.store}:{product.external_id}"
        store = StoreOut(id=product.store, name=STORE_NAMES.get(product.store, product.store.title()))
        category_name = product.category or "Other"
        offer = ProductOfferOut(
            id=f"{product_id}:offer",
            productId=product_id,
            store=store,
            price=product.price,
            oldPrice=product.old_price,
            inStock=product.in_stock,
            productUrl=str(product.product_url) if product.product_url else None,
            updatedAt=product.updated_at.isoformat(),
        )
        return ProductDetailsOut(
            id=product_id,
            name=product.name,
            brand=product.brand,
            category=categories_by_name[category_name],
            imageUrl=str(product.image_url) if product.image_url else None,
            packageValue=product.package_value,
            packageUnit=product.package_unit,
            minimumPrice=product.price,
            oldMinimumPrice=product.old_price,
            offersCount=1,
            inStock=product.in_stock,
            updatedAt=product.updated_at.isoformat(),
            offers=[offer],
        )

    @staticmethod
    def _build_categories(products: list[ProductDetailsOut]) -> list[CategoryOut]:
        categories = {product.category.id: product.category for product in products}
        return sorted(categories.values(), key=lambda category: category.name)

    @staticmethod
    def _build_stores(products: list[ProductDetailsOut]) -> list[StoreOut]:
        stores = {offer.store.id: offer.store for product in products for offer in product.offers}
        return sorted(stores.values(), key=lambda store: store.name)


catalog_repository = CatalogRepository()
