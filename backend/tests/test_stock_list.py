"""Tests for the GET /api/stocks endpoint."""
import pytest


@pytest.mark.asyncio
async def test_stock_list_returns_200(client):
    response = await client.get("/api/stocks")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_stock_list_returns_stocks_key(client):
    response = await client.get("/api/stocks")
    data = response.json()
    assert "stocks" in data


@pytest.mark.asyncio
async def test_stock_list_returns_at_least_30_stocks(client):
    response = await client.get("/api/stocks")
    data = response.json()
    assert len(data["stocks"]) >= 30


@pytest.mark.asyncio
async def test_stock_list_each_stock_has_symbol(client):
    response = await client.get("/api/stocks")
    data = response.json()
    for stock in data["stocks"]:
        assert "symbol" in stock
        assert isinstance(stock["symbol"], str)
        assert len(stock["symbol"]) > 0


@pytest.mark.asyncio
async def test_stock_list_each_stock_has_name(client):
    response = await client.get("/api/stocks")
    data = response.json()
    for stock in data["stocks"]:
        assert "name" in stock
        assert isinstance(stock["name"], str)
        assert len(stock["name"]) > 0


@pytest.mark.asyncio
async def test_stock_list_each_stock_has_sector(client):
    response = await client.get("/api/stocks")
    data = response.json()
    for stock in data["stocks"]:
        assert "sector" in stock
        assert isinstance(stock["sector"], str)
        assert len(stock["sector"]) > 0


@pytest.mark.asyncio
async def test_stock_list_contains_common_symbols(client):
    response = await client.get("/api/stocks")
    data = response.json()
    symbols = {s["symbol"] for s in data["stocks"]}
    # These are in mock_stocks.json
    for expected in ["AAPL", "MSFT", "GOOGL"]:
        assert expected in symbols, f"{expected} missing from stock list"


@pytest.mark.asyncio
async def test_stock_list_symbols_are_uppercase(client):
    response = await client.get("/api/stocks")
    data = response.json()
    for stock in data["stocks"]:
        assert stock["symbol"] == stock["symbol"].upper()
