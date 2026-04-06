from slowapi import Limiter
from slowapi.util import get_remote_address

# SEC-001: per-IP rate limiter using the client's remote address as the key
limiter = Limiter(key_func=get_remote_address)
