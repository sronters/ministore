from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.time import utcnow
from app.models.cart import Cart
from app.models.user import User


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_or_create_from_telegram(self, data: dict) -> User:
        telegram_id = int(data["id"])
        result = await self.session.execute(select(User).where(User.telegram_id == telegram_id))
        user = result.scalar_one_or_none()
        if user is None:
            user = User(
                telegram_id=telegram_id,
                username=data.get("username"),
                first_name=data.get("first_name", ""),
                last_name=data.get("last_name"),
                language_code=data.get("language_code"),
                city="Астана",
                last_seen_at=utcnow(),
            )
            self.session.add(user)
            await self.session.flush()
            self.session.add(Cart(user_id=user.id))
        else:
            user.username = data.get("username")
            user.first_name = data.get("first_name", user.first_name)
            user.last_name = data.get("last_name")
            user.language_code = data.get("language_code")
            user.last_seen_at = utcnow()
        await self.session.commit()
        await self.session.refresh(user)
        return user
