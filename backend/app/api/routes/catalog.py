from fastapi import APIRouter, HTTPException, Query

from app.repositories.mock_catalog import MockCatalogRepository
from app.schemas.catalog import ProductBatchIn, ProductDetailsOut, ProductSearchOut

router = APIRouter(tags=["catalog"])
repo = MockCatalogRepository()


@router.get("/products/search", response_model=ProductSearchOut)
async def search_products(
    q: str = "",
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=50),
    categoryId: str | None = None,
    brand: str | None = None,
    storeId: str | None = None,
    inStockOnly: bool = False,
    sort: str = "relevance",
) -> ProductSearchOut:
    items, total = repo.search(q, page, limit, categoryId, brand, storeId, inStockOnly, sort)
    return ProductSearchOut(items=items, page=page, limit=limit, total=total)


@router.get("/products/{product_id}", response_model=ProductDetailsOut)
async def get_product(product_id: str) -> ProductDetailsOut:
    product = repo.get(product_id)
    if product is None:
        raise HTTPException(status_code=404, detail={"error": {"code": "PRODUCT_NOT_FOUND", "message": "Товар не найден"}})
    return product


@router.post("/products/batch", response_model=list[ProductDetailsOut])
async def batch_products(payload: ProductBatchIn) -> list[ProductDetailsOut]:
    return repo.batch(payload.productIds)


@router.get("/categories")
async def categories():
    return repo.categories()


@router.get("/stores")
async def stores():
    return repo.stores()
