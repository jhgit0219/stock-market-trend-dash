import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.limiter import limiter
from app.routes import stocks

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Stock Market Trends API",
    description="Proxy API for stock market historical data with in-memory caching",
    version="0.1.0",
)

# SEC-001: attach the slowapi rate limiter and its 429 error handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# SEC-004: restrict CORS — only the methods and headers this API actually needs,
# no credentials (no cookies or HTTP auth in use)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=settings.allowed_origin_regex,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


# SEC-005: security response headers on every reply
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


# SEC-007: log every incoming request with path and client IP
@app.middleware("http")
async def log_requests(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    logger.info("Request: %s %s from %s", request.method, request.url.path, client_ip)
    response = await call_next(request)
    logger.info(
        "Response: %s %s -> %s from %s",
        request.method,
        request.url.path,
        response.status_code,
        client_ip,
    )
    return response


app.include_router(stocks.router)


# SEC-013: warn at startup when no API key is configured
@app.on_event("startup")
async def startup_checks() -> None:
    if not settings.alpha_vantage_api_key:
        logger.warning(
            "No API key configured — ALPHA_VANTAGE_API_KEY is not set. "
            "Serving mock data only."
        )


@app.get("/api/health", tags=["health"])
def health() -> dict[str, str]:
    data_source = "live" if settings.alpha_vantage_api_key else "mock"
    return {"status": "ok", "version": "0.1.0", "data_source": data_source}
