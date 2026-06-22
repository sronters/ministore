from pydantic import BaseModel


class TelegramAuthIn(BaseModel):
    initData: str


class UserOut(BaseModel):
    id: str
    firstName: str
    lastName: str | None
    username: str | None
    city: str


class AuthOut(BaseModel):
    accessToken: str
    user: UserOut
