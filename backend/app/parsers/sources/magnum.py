from __future__ import annotations

from app.parsers.base import StoreParser
from app.parsers.schemas import ParsedProduct


class MagnumParser(StoreParser):
    store = "magnum"

    async def fetch_products(self, limit: int | None = None) -> list[ParsedProduct]:
        raise NotImplementedError("MagnumParser needs source research before live fetching is enabled.")
