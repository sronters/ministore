from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import get_session
from app.repositories.users import UserRepository
from app.schemas.auth import AuthOut, TelegramAuthIn, UserOut
from app.services.security import create_access_token
from app.telegram.init_data import TelegramAuthError, verify_init_data

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/telegram", response_model=AuthOut)
async def auth_telegram(payload: TelegramAuthIn, session: Annotated[AsyncSession, Depends(get_session)]) -> AuthOut:
    settings = get_settings()
    try:
        if payload.initData:
            telegram_user = verify_init_data(
                payload.initData,
                settings.telegram_bot_token,
                settings.telegram_webapp_auth_ttl_seconds,
            )
        elif not settings.telegram_bot_token:
            telegram_user = {"id": 1, "first_name": "Dev", "username": "dev", "language_code": "ru"}
        else:
            raise TelegramAuthError("initData is required")
    except TelegramAuthError as exc:
        raise HTTPException(status_code=401, detail={"error": {"code": "TELEGRAM_AUTH_FAILED", "message": str(exc)}}) from exc

    user = await UserRepository(session).get_or_create_from_telegram(telegram_user)
    return AuthOut(
        accessToken=create_access_token(user.id),
        user=UserOut(
            id=str(user.id),
            firstName=user.first_name,
            lastName=user.last_name,
            username=user.username,
            city=user.city,
        ),
    )
