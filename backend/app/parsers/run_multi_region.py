from __future__ import annotations

import asyncio
import json
from pathlib import Path

from app.parsers.schemas import ParsedProduct
from app.parsers.sources.json_file import JsonFileParser


async def main():
    all_products = []
    regions = ["astana", "almaty", "shymkent"]
    
    for region in regions:
        store_slug = f"arbuz-{region}"
        input_path = Path(f"../data/{region}.json")
        
        # The StoreSlug needs to be valid, so we will monkey patch it for this script
        from typing import Literal
        from app.parsers import schemas
        original_slugs = schemas.StoreSlug.__args__
        new_slugs = original_slugs + (f"arbuz-{region}",)
        ExtendedStoreSlug = Literal[*new_slugs]
        schemas.StoreSlug = ExtendedStoreSlug
        schemas.ParsedProduct.model_rebuild(force=True)

        parser = JsonFileParser(store=store_slug, path=input_path)
        products = await parser.fetch_products()
        all_products.extend(products)

    output_path = Path("../data/parsed_products.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps([product.model_dump(mode="json", exclude={"raw_data"}) for product in all_products], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Parsed {len(all_products)} products from {len(regions)} regions into {output_path}")

if __name__ == "__main__":
    # A bit of a hack to extend the Literal StoreSlug type
    from typing import Literal
    from app.parsers import schemas
    
    original_slugs = schemas.StoreSlug.__args__
    new_slugs = original_slugs + ("arbuz-astana", "arbuz-almaty", "arbuz-shymkent")
    
    # Create a new Literal type with the extended slugs
    ExtendedStoreSlug = Literal[*new_slugs]
    
    # Monkey-patch the StoreSlug in the schemas module
    schemas.StoreSlug = ExtendedStoreSlug
    schemas.ParsedProduct.model_rebuild(force=True)

    asyncio.run(main())
