"""Tests for the POST /api/stocks/batch-history endpoint."""
import pytest


@pytest.mark.asyncio
async def test_batch_history_returns_200_for_valid_symbols(client):
    response = await client.post(
        "/api/stocks/batch-history",
        json={"symbols": ["AAPL", "MSFT"]},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_batch_history_returns_results_key(client):
    response = await client.post(
        "/api/stocks/batch-history",
        json={"symbols": ["AAPL"]},
    )
    data = response.json()
    assert "results" in data


@pytest.mark.asyncio
async def test_batch_history_results_keyed_by_symbol(client):
    response = await client.post(
        "/api/stocks/batch-history",
        json={"symbols": ["AAPL", "MSFT"]},
    )
    data = response.json()
    assert "AAPL" in data["results"]
    assert "MSFT" in data["results"]


@pytest.mark.asyncio
async def test_batch_history_each_result_has_history_structure(client):
    response = await client.post(
        "/api/stocks/batch-history",
        json={"symbols": ["AAPL"]},
    )
    data = response.json()
    history = data["results"]["AAPL"]
    assert "symbol" in history
    assert "name" in history
    assert "data" in history
    assert "mock" in history
    assert isinstance(history["data"], list)


@pytest.mark.asyncio
async def test_batch_history_accepts_exactly_10_symbols(client):
    symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "JPM", "V", "JNJ"]
    response = await client.post(
        "/api/stocks/batch-history",
        json={"symbols": symbols},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_batch_history_rejects_more_than_10_symbols(client):
    """More than 10 symbols should be rejected with a 422 validation error."""
    symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "JPM", "V", "JNJ", "EXTRA"]
    response = await client.post(
        "/api/stocks/batch-history",
        json={"symbols": symbols},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_batch_history_skips_unknown_symbols(client):
    """Valid-format symbols not in the mock dataset are silently omitted from results."""
    response = await client.post(
        "/api/stocks/batch-history",
        json={"symbols": ["AAPL", "UNKNOWNXYZ"]},
    )
    assert response.status_code == 200
    data = response.json()
    assert "AAPL" in data["results"]
    assert "UNKNOWNXYZ" not in data["results"]


@pytest.mark.asyncio
async def test_batch_history_returns_empty_results_for_all_invalid(client):
    """Valid-format symbols not in mock dataset produce an empty results dict."""
    response = await client.post(
        "/api/stocks/batch-history",
        json={"symbols": ["FAKEONE", "FAKETWO"]},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["results"] == {}


@pytest.mark.asyncio
async def test_batch_history_requires_symbols_field(client):
    response = await client.post(
        "/api/stocks/batch-history",
        json={},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_batch_history_single_symbol(client):
    response = await client.post(
        "/api/stocks/batch-history",
        json={"symbols": ["NVDA"]},
    )
    assert response.status_code == 200
    data = response.json()
    assert "NVDA" in data["results"]
    assert len(data["results"]["NVDA"]["data"]) == 120


@pytest.mark.asyncio
async def test_batch_history_rejects_lowercase_symbols(client):
    """SEC-002: symbols must be uppercase — lowercase input returns 422."""
    response = await client.post(
        "/api/stocks/batch-history",
        json={"symbols": ["aapl", "msft"]},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_batch_history_rejects_symbols_with_digits(client):
    """SEC-002: symbols must match ^[A-Z.]{1,10}$ — digits return 422."""
    response = await client.post(
        "/api/stocks/batch-history",
        json={"symbols": ["FAKE1", "FAKE2"]},
    )
    assert response.status_code == 422
