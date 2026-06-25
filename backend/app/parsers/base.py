from __future__ import annotations

from abc import ABC, abstractmethod

from app.parsers.schemas import ParsedProduct, StoreSlug


class StoreParser(ABC):
    store: StoreSlug

    @abstractmethod
    async def fetch_products(self, limit: int | None = None) -> list[ParsedProduct]:
        """Fetch and normalize products from one source."""
