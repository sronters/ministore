from __future__ import annotations

import json
from pathlib import Path

from app.parsers.base import StoreParser
from app.parsers.schemas import ParsedProduct, StoreSlug


class JsonFileParser(StoreParser):
    def __init__(self, store: StoreSlug, path: Path) -> None:
        self.store = store
        self.path = path

    async def fetch_products(self, limit: int | None = None) -> list[ParsedProduct]:
        payload = json.loads(self.path.read_text(encoding="utf-8"))
        raw_items = payload["items"] if isinstance(payload, dict) and "items" in payload else payload
        items = raw_items[:limit] if limit is not None else raw_items
        return [ParsedProduct.model_validate({"store": self.store, **item}) for item in items]
