import hashlib
import hmac
import json
import time
from urllib.parse import parse_qsl


class TelegramAuthError(ValueError):
    pass


def verify_init_data(init_data: str, bot_token: str, ttl_seconds: int = 86400, now: int | None = None) -> dict:
    if not init_data:
        raise TelegramAuthError("initData is empty")
    if not bot_token:
        raise TelegramAuthError("bot token is not configured")

    pairs = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = pairs.pop("hash", None)
    if not received_hash:
        raise TelegramAuthError("hash is missing")

    data_check_string = "\n".join(f"{key}={value}" for key, value in sorted(pairs.items()))
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(calculated_hash, received_hash):
        raise TelegramAuthError("invalid signature")

    auth_date = int(pairs.get("auth_date", "0"))
    current_time = now or int(time.time())
    if current_time - auth_date > ttl_seconds:
        raise TelegramAuthError("auth_date is too old")

    user_raw = pairs.get("user")
    if not user_raw:
        raise TelegramAuthError("user is missing")
    return json.loads(user_raw)
