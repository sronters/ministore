from typing import Annotated

from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models.user import User
from app.services.security import decode_access_token


async def current_user(
    session: Annotated[AsyncSession, Depends(get_session)],
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail={"error": {"code": "UNAUTHORIZED", "message": "Нет авторизации"}})
    token = authorization.removeprefix("Bearer ").strip()
    try:
      user_id = decode_access_token(token)
    except Exception as exc:
      raise HTTPException(status_code=401, detail={"error": {"code": "INVALID_TOKEN", "message": "Сессия недействительна"}}) from exc
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail={"error": {"code": "USER_NOT_FOUND", "message": "Пользователь не найден"}})
    return user
