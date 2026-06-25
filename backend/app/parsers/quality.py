from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timezone

from pydantic import BaseModel

from app.parsers.schemas import ParsedProduct, StoreSlug


class QualityIssue(BaseModel):
    severity: str
    code: str
    message: str
    external_id: str | None = None


class QualityReport(BaseModel):
    store: StoreSlug
    checked_at: datetime
    total_products: int
    in_stock_products: int
    unique_barcodes: int
    duplicate_external_ids: list[str]
    missing_barcode_count: int
    missing_package_count: int
    missing_image_count: int
    missing_product_url_count: int
    issues: list[QualityIssue]

    @property
    def has_errors(self) -> bool:
        return any(issue.severity == "error" for issue in self.issues)


def build_quality_report(store: StoreSlug, products: list[ParsedProduct]) -> QualityReport:
    ids = [product.external_id for product in products]
    duplicate_ids = sorted(item for item, count in Counter(ids).items() if count > 1)
    issues: list[QualityIssue] = []

    for duplicate_id in duplicate_ids:
        issues.append(
            QualityIssue(
                severity="error",
                code="duplicate_external_id",
                message="External product ID must be unique inside one store.",
                external_id=duplicate_id,
            )
        )

    for product in products:
        if product.old_price is not None and product.old_price <= product.price:
            issues.append(
                QualityIssue(
                    severity="warning",
                    code="old_price_not_higher",
                    message="Old price is present but is not higher than current price.",
                    external_id=product.external_id,
                )
            )
        if product.package_value is None or product.package_unit is None:
            issues.append(
                QualityIssue(
                    severity="warning",
                    code="missing_package",
                    message="Package value/unit is missing; matching quality will be lower.",
                    external_id=product.external_id,
                )
            )

    barcodes = {product.barcode for product in products if product.barcode}
    return QualityReport(
        store=store,
        checked_at=datetime.now(timezone.utc),
        total_products=len(products),
        in_stock_products=sum(1 for product in products if product.in_stock),
        unique_barcodes=len(barcodes),
        duplicate_external_ids=duplicate_ids,
        missing_barcode_count=sum(1 for product in products if not product.barcode),
        missing_package_count=sum(1 for product in products if product.package_value is None or product.package_unit is None),
        missing_image_count=sum(1 for product in products if product.image_url is None),
        missing_product_url_count=sum(1 for product in products if product.product_url is None),
        issues=issues,
    )


def barcode_intersections(products: list[ParsedProduct]) -> dict[str, list[ParsedProduct]]:
    grouped: dict[str, list[ParsedProduct]] = defaultdict(list)
    for product in products:
        if product.barcode:
            grouped[product.barcode].append(product)
    return {barcode: items for barcode, items in grouped.items() if len({item.store for item in items}) > 1}
