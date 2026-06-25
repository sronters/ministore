from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

PackageUnit = Literal["g", "kg", "ml", "l", "pcs"]
StoreSlug = Literal["arbuz", "small", "magnum", "airba"]


class ParsedProduct(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    store: StoreSlug
    external_id: str
    name: str
    brand: str | None = None
    category: str | None = None
    image_url: HttpUrl | None = None
    product_url: HttpUrl | None = None
    barcode: str | None = None
    package_value: float | None = None
    package_unit: PackageUnit | None = None
    price: int = Field(gt=0)
    old_price: int | None = Field(default=None, gt=0)
    in_stock: bool
    updated_at: datetime
    raw_data: dict | None = None

    @field_validator("external_id", "name")
    @classmethod
    def required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be empty")
        return value

    @field_validator("barcode")
    @classmethod
    def normalize_barcode(cls, value: str | None) -> str | None:
        if value is None:
            return None
        digits = "".join(char for char in value if char.isdigit())
        return digits or None


class ParserRunResult(BaseModel):
    store: StoreSlug
    products: list[ParsedProduct]
    started_at: datetime
    finished_at: datetime
