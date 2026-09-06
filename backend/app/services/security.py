import os
import base64
from cryptography.fernet import Fernet

SECRET_KEY_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "secret.key")

def _get_or_create_key() -> bytes:
    if os.path.exists(SECRET_KEY_PATH):
        with open(SECRET_KEY_PATH, "rb") as f:
            return f.read().strip()
    key = Fernet.generate_key()
    with open(SECRET_KEY_PATH, "wb") as f:
        f.write(key)
    return key

_KEY = _get_or_create_key()
_CIPHER = Fernet(_KEY)

def encrypt_secret(plain_text: str) -> str:
    if not plain_text:
        return ""
    return _CIPHER.encrypt(plain_text.encode("utf-8")).decode("utf-8")

def decrypt_secret(cipher_text: str) -> str:
    if not cipher_text:
        return ""
    try:
        return _CIPHER.decrypt(cipher_text.encode("utf-8")).decode("utf-8")
    except Exception:
        return "[Decryption Failed]"
