"""Shared test fixtures and configuration for the backend test suite."""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services import stock_service


@pytest.fixture(autouse=True)
def clear_cache():
    """Clear the in-memory cache before each test to ensure isolation."""
    stock_service._cache.clear()
    yield
    stock_service._cache.clear()


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Reset the slowapi in-memory rate limiter storage between tests."""
    limiter = app.state.limiter
    if hasattr(limiter, "_storage") and hasattr(limiter._storage, "storage"):
        limiter._storage.storage.clear()
    yield


@pytest.fixture
async def client():
    """Async HTTP client for testing FastAPI endpoints."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac
