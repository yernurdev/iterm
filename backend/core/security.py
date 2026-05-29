from datetime import datetime, timedelta
from hashlib import pbkdf2_hmac
from hmac import compare_digest
from secrets import token_hex
from typing import Any, Union

import jwt

from .config import settings

ALGORITHM = "HS256"
HASH_ITERATIONS = 260_000


def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    expire = datetime.utcnow() + (
        expires_delta if expires_delta else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode = {"exp": expire, "sub": str(subject)}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def get_password_hash(password: str) -> str:
    salt = token_hex(16)
    digest = pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), HASH_ITERATIONS)
    return f"pbkdf2_sha256${HASH_ITERATIONS}${salt}${digest.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password.startswith("pbkdf2_sha256$"):
        return False

    try:
        _, iterations, salt, expected = hashed_password.split("$", 3)
        digest = pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), int(iterations))
    except (ValueError, TypeError):
        return False

    return compare_digest(digest.hex(), expected)
