from __future__ import annotations

from app.parsers.base import StoreParser
from app.parsers.schemas import ParsedProduct


class SmallParser(StoreParser):
    store = "small"

    async def fetch_products(self, limit: int | None = None) -> list[ParsedProduct]:
        raise NotImplementedError(
            "SmallParser needs a stable source. The public site currently points users to partner delivery/catalog pages."
        )
