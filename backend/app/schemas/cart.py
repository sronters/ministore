from pydantic import BaseModel, Field

from app.schemas.catalog import ProductOut


class CartItemCreate(BaseModel):
    productId: str
    quantity: int = Field(default=1, ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1)


class CartItemOut(BaseModel):
    id: str
    productId: str
    quantity: int
    product: ProductOut


class CartOut(BaseModel):
    items: list[CartItemOut]
