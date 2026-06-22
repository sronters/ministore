import hashlib
import hmac
import json
from urllib.parse import urlencode

import pytest

from app.telegram.init_data import TelegramAuthError, verify_init_data


def signed_init_data(bot_token: str, auth_date: int = 1_800_000_000) -> str:
    data = {
        "auth_date": str(auth_date),
        "query_id": "test",
        "user": json.dumps({"id": 42, "first_name": "Bakhtiyar"}, separators=(",", ":")),
    }
    data_check_string = "\n".join(f"{key}={value}" for key, value in sorted(data.items()))
    secret = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    data["hash"] = hmac.new(secret, data_check_string.encode(), hashlib.sha256).hexdigest()
    return urlencode(data)


def test_valid_telegram_auth() -> None:
    user = verify_init_data(signed_init_data("token"), "token", now=1_800_000_100)
    assert user["id"] == 42


def test_invalid_signature() -> None:
    with pytest.raises(TelegramAuthError):
        verify_init_data(signed_init_data("token") + "broken", "token", now=1_800_000_100)


def test_expired_auth_date() -> None:
    with pytest.raises(TelegramAuthError):
        verify_init_data(signed_init_data("token", auth_date=1), "token", ttl_seconds=10, now=100)
