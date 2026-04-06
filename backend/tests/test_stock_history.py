"""Tests for the GET /api/stocks/{symbol}/history endpoint."""
import pytest


@pytest.mark.asyncio
async def test_history_returns_200_for_valid_symbol(client):
    response = await client.get("/api/stocks/AAPL/history")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_history_returns_404_for_invalid_symbol(client):
    response = await client.get("/api/stocks/INVALIDXYZ/history")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_history_404_has_error_body(client):
    response = await client.get("/api/stocks/NOTEXIST/history")
    data = response.json()
    assert "detail" in data
    detail = data["detail"]
    assert "code" in detail
    assert detail["code"] == "STOCK_NOT_FOUND"
    assert "message" in detail


@pytest.mark.asyncio
async def test_history_returns_symbol_field(client):
    response = await client.get("/api/stocks/AAPL/history")
    data = response.json()
    assert "symbol" in data
    assert data["symbol"] == "AAPL"


@pytest.mark.asyncio
async def test_history_returns_name_field(client):
    response = await client.get("/api/stocks/AAPL/history")
    data = response.json()
    assert "name" in data
    assert isinstance(data["name"], str)
    assert len(data["name"]) > 0


@pytest.mark.asyncio
async def test_history_returns_data_field(client):
    response = await client.get("/api/stocks/AAPL/history")
    data = response.json()
    assert "data" in data
    assert isinstance(data["data"], list)


@pytest.mark.asyncio
async def test_history_returns_120_data_points(client):
    """Mock data should have 120 monthly data points (10 years)."""
    response = await client.get("/api/stocks/AAPL/history")
    data = response.json()
    assert len(data["data"]) == 120


@pytest.mark.asyncio
async def test_history_data_points_have_date_and_close(client):
    response = await client.get("/api/stocks/AAPL/history")
    data = response.json()
    for point in data["data"]:
        assert "date" in point
        assert "close" in point
        assert isinstance(point["close"], (int, float))
        assert point["close"] > 0


@pytest.mark.asyncio
async def test_history_data_dates_are_strings(client):
    response = await client.get("/api/stocks/AAPL/history")
    data = response.json()
    for point in data["data"]:
        assert isinstance(point["date"], str)


@pytest.mark.asyncio
async def test_history_returns_mock_flag(client):
    response = await client.get("/api/stocks/AAPL/history")
    data = response.json()
    assert "mock" in data
    # Without an API key, mock data is used
    assert data["mock"] is True


@pytest.mark.asyncio
async def test_history_rejects_lowercase_symbol(client):
    """SEC-002: symbol path param must be uppercase — lowercase returns 422."""
    response_upper = await client.get("/api/stocks/MSFT/history")
    response_lower = await client.get("/api/stocks/msft/history")
    assert response_upper.status_code == 200
    assert response_lower.status_code == 422


@pytest.mark.asyncio
async def test_history_works_for_multiple_known_symbols(client):
    known_symbols = ["MSFT", "GOOGL", "AMZN", "NVDA", "TSLA"]
    for symbol in known_symbols:
        response = await client.get(f"/api/stocks/{symbol}/history")
        assert response.status_code == 200, f"Expected 200 for {symbol}, got {response.status_code}"
