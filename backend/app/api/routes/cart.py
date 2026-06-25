from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import current_user
from app.db.session import get_session
from app.models.cart import Cart, CartItem
from app.models.user import User
from app.repositories.catalog import catalog_repository
from app.schemas.cart import CartItemCreate, CartItemOut, CartItemUpdate, CartOut
from app.schemas.catalog import CartComparisonOut
from app.services.comparison import compare_cart

router = APIRouter(prefix="/cart", tags=["cart"])
catalog = catalog_repository


async def get_user_cart(session: AsyncSession, user: User) -> Cart:
    result = await session.execute(select(Cart).options(selectinload(Cart.items)).where(Cart.user_id == user.id))
    cart = result.scalar_one_or_none()
    if cart is None:
        cart = Cart(user_id=user.id)
        session.add(cart)
        await session.flush()
    return cart


def serialize_cart(cart: Cart) -> CartOut:
    products = {product.id: product for product in catalog.batch([item.external_product_id for item in cart.items])}
    items = [
        CartItemOut(
            id=item.external_product_id,
            productId=item.external_product_id,
            quantity=item.quantity,
            product=products[item.external_product_id],
        )
        for item in cart.items
        if item.external_product_id in products
    ]
    return CartOut(items=items)


@router.get("", response_model=CartOut)
async def get_cart(user: Annotated[User, Depends(current_user)], session: Annotated[AsyncSession, Depends(get_session)]) -> CartOut:
    cart = await get_user_cart(session, user)
    return serialize_cart(cart)


@router.post("/items", response_model=CartOut)
async def add_item(
    payload: CartItemCreate,
    user: Annotated[User, Depends(current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> CartOut:
    if catalog.get(payload.productId) is None:
        raise HTTPException(status_code=404, detail={"error": {"code": "PRODUCT_NOT_FOUND", "message": "Товар не найден"}})
    cart = await get_user_cart(session, user)
    existing = next((item for item in cart.items if item.external_product_id == payload.productId), None)
    if existing:
        existing.quantity += payload.quantity
    else:
        cart.items.append(CartItem(external_product_id=payload.productId, quantity=payload.quantity))
    await session.commit()
    await session.refresh(cart, attribute_names=["items"])
    return serialize_cart(cart)


@router.patch("/items/{product_id}", response_model=CartOut)
async def update_item(
    product_id: str,
    payload: CartItemUpdate,
    user: Annotated[User, Depends(current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> CartOut:
    cart = await get_user_cart(session, user)
    item = next((candidate for candidate in cart.items if candidate.external_product_id == product_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail={"error": {"code": "CART_ITEM_NOT_FOUND", "message": "Позиция не найдена"}})
    item.quantity = payload.quantity
    await session.commit()
    await session.refresh(cart, attribute_names=["items"])
    return serialize_cart(cart)


@router.delete("/items/{product_id}", response_model=CartOut)
async def delete_item(
    product_id: str,
    user: Annotated[User, Depends(current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> CartOut:
    cart = await get_user_cart(session, user)
    await session.execute(delete(CartItem).where(CartItem.cart_id == cart.id, CartItem.external_product_id == product_id))
    await session.commit()
    await session.refresh(cart, attribute_names=["items"])
    return serialize_cart(cart)


@router.delete("", response_model=CartOut)
async def clear_cart(user: Annotated[User, Depends(current_user)], session: Annotated[AsyncSession, Depends(get_session)]) -> CartOut:
    cart = await get_user_cart(session, user)
    await session.execute(delete(CartItem).where(CartItem.cart_id == cart.id))
    await session.commit()
    await session.refresh(cart, attribute_names=["items"])
    return serialize_cart(cart)


@router.get("/comparison", response_model=CartComparisonOut)
async def compare_user_cart(
    user: Annotated[User, Depends(current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> CartComparisonOut:
    cart = await get_user_cart(session, user)
    products = catalog.batch([item.external_product_id for item in cart.items])
    return compare_cart([(item.external_product_id, item.quantity) for item in cart.items], products)
