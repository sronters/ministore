from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path

from app.parsers.quality import build_quality_report
from app.parsers.schemas import ParsedProduct, StoreSlug
from app.parsers.sources.arbuz import ArbuzParser
from app.parsers.sources.json_file import JsonFileParser


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run catalog parsers and write normalized JSON output.")
    parser.add_argument("--store", choices=["arbuz", "small", "magnum", "airba"], required=True)
    parser.add_argument("--input-json", type=Path, help="Use a captured source JSON file while live parser research is in progress.")
    parser.add_argument("--input-html", type=Path, nargs="+", help="Use one or more captured store HTML pages and extract embedded product data.")
    parser.add_argument("--city", default="astana", help="City slug used by the source page, for example astana or almaty.")
    parser.add_argument("--output", type=Path, default=Path("data/parsed_products.json"))
    parser.add_argument("--quality-output", type=Path, default=Path("data/quality_report.json"))
    parser.add_argument("--limit", type=int, default=None)
    return parser.parse_args()


async def _run() -> None:
    args = _parse_args()
    store: StoreSlug = args.store
    if args.input_html is not None:
        if store != "arbuz":
            raise SystemExit("--input-html is currently implemented for Arbuz only.")
        parser = ArbuzParser(html_paths=args.input_html, city=args.city)
    elif args.input_json is not None:
        parser = JsonFileParser(store=store, path=args.input_json)
    else:
        raise SystemExit("Pass --input-json or --input-html.")

    products = await parser.fetch_products(limit=args.limit)
    report = build_quality_report(store, products)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.quality_output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps([_dump_product(product) for product in products], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    args.quality_output.write_text(report.model_dump_json(by_alias=True, indent=2), encoding="utf-8")

    print(f"Parsed {len(products)} {store} products -> {args.output}")
    print(f"Quality report -> {args.quality_output}")
    if report.has_errors:
        raise SystemExit(1)


def _dump_product(product: ParsedProduct) -> dict:
    return product.model_dump(mode="json", exclude={"raw_data"})


if __name__ == "__main__":
    asyncio.run(_run())
