from pydantic import BaseModel, Field


class CategoryOut(BaseModel):
    id: str
    name: str


class StoreOut(BaseModel):
    id: str
    name: str
    logoUrl: str | None = None


class ProductOut(BaseModel):
    id: str
    name: str
    brand: str | None
    category: CategoryOut
    imageUrl: str | None
    packageValue: float | None
    packageUnit: str | None
    minimumPrice: int
    oldMinimumPrice: int | None
    offersCount: int
    inStock: bool
    updatedAt: str


class ProductOfferOut(BaseModel):
    id: str
    productId: str
    store: StoreOut
    price: int
    oldPrice: int | None
    inStock: bool
    productUrl: str | None
    updatedAt: str


class ProductDetailsOut(ProductOut):
    offers: list[ProductOfferOut]


class ProductSearchOut(BaseModel):
    items: list[ProductOut]
    page: int
    limit: int
    total: int


class ProductBatchIn(BaseModel):
    productIds: list[str] = Field(alias="productIds")


class MissingItemOut(BaseModel):
    productId: str
    name: str


class StoreComparisonOut(BaseModel):
    store: StoreOut
    total: int
    availableItemsCount: int
    totalItemsCount: int
    complete: bool
    missingItems: list[MissingItemOut]
    differenceFromBest: int | None


class CartComparisonOut(BaseModel):
    bestStore: StoreComparisonOut | None
    stores: list[StoreComparisonOut]
    maximumSaving: int | None
