"""Tests for the stock_service module — caching, mock data fallback, and service logic."""
import time
import pytest
from unittest.mock import patch, AsyncMock

from app.services import stock_service
from app.services.stock_service import (
    get_stock_list,
    get_stock_history,
    get_batch_history,
    _cache_get,
    _cache_set,
    CacheEntry,
)
from app.schemas.stock import StockInfo, StockHistory, DataPoint


# ---- CacheEntry unit tests ----

class TestCacheEntry:
    def test_is_valid_returns_true_within_ttl(self):
        entry = CacheEntry(value="test", ttl=60)
        assert entry.is_valid() is True

    def test_is_valid_returns_false_after_ttl_expires(self):
        entry = CacheEntry(value="test", ttl=0)
        # TTL=0 means expires immediately; wait a tiny bit
        time.sleep(0.01)
        assert entry.is_valid() is False

    def test_entry_stores_value(self):
        entry = CacheEntry(value={"key": "val"}, ttl=60)
        assert entry.value == {"key": "val"}


# ---- Cache get/set unit tests ----

class TestCacheGetSet:
    def test_cache_get_returns_none_for_missing_key(self):
        result = _cache_get("nonexistent_key_xyz")
        assert result is None

    def test_cache_set_and_get_returns_value(self):
        _cache_set("test_key", "test_value", ttl=60)
        result = _cache_get("test_key")
        assert result == "test_value"

    def test_cache_get_returns_none_after_expiry(self):
        _cache_set("expiring_key", "data", ttl=0)
        time.sleep(0.01)
        result = _cache_get("expiring_key")
        assert result is None

    def test_cache_get_removes_expired_entry(self):
        _cache_set("to_remove", "stale", ttl=0)
        time.sleep(0.01)
        _cache_get("to_remove")
        # After expired get, key should be removed
        assert "to_remove" not in stock_service._cache

    def test_cache_stores_complex_objects(self):
        obj = StockInfo(symbol="AAPL", name="Apple Inc.", sector="Technology")
        _cache_set("stock_obj", obj, ttl=60)
        result = _cache_get("stock_obj")
        assert result == obj


# ---- get_stock_list tests ----

class TestGetStockList:
    def test_returns_list_of_stock_info(self):
        result = get_stock_list()
        assert isinstance(result, list)
        assert all(isinstance(s, StockInfo) for s in result)

    def test_returns_at_least_30_stocks(self):
        result = get_stock_list()
        assert len(result) >= 30

    def test_each_stock_has_non_empty_symbol(self):
        result = get_stock_list()
        for stock in result:
            assert stock.symbol
            assert len(stock.symbol) > 0

    def test_each_stock_has_non_empty_name(self):
        result = get_stock_list()
        for stock in result:
            assert stock.name
            assert len(stock.name) > 0

    def test_each_stock_has_non_empty_sector(self):
        result = get_stock_list()
        for stock in result:
            assert stock.sector

    def test_result_is_cached_after_first_call(self):
        result1 = get_stock_list()
        result2 = get_stock_list()
        # Second call should return the same object (cached)
        assert result1 is result2

    def test_cache_key_is_stock_list(self):
        get_stock_list()
        assert _cache_get("stock_list") is not None


# ---- get_stock_history tests ----

class TestGetStockHistory:
    @pytest.mark.asyncio
    async def test_returns_stock_history_for_known_symbol(self):
        result = await get_stock_history("AAPL")
        assert result is not None
        assert isinstance(result, StockHistory)

    @pytest.mark.asyncio
    async def test_returns_none_for_unknown_symbol(self):
        result = await get_stock_history("UNKNOWNSYMBOLXYZ")
        assert result is None

    @pytest.mark.asyncio
    async def test_history_symbol_matches_input(self):
        result = await get_stock_history("MSFT")
        assert result is not None
        assert result.symbol == "MSFT"

    @pytest.mark.asyncio
    async def test_history_has_120_data_points(self):
        result = await get_stock_history("AAPL")
        assert result is not None
        assert len(result.data) == 120

    @pytest.mark.asyncio
    async def test_history_data_points_are_DataPoint_instances(self):
        result = await get_stock_history("AAPL")
        assert result is not None
        for point in result.data:
            assert isinstance(point, DataPoint)

    @pytest.mark.asyncio
    async def test_history_all_close_prices_are_positive(self):
        result = await get_stock_history("NVDA")
        assert result is not None
        for point in result.data:
            assert point.close > 0

    @pytest.mark.asyncio
    async def test_history_is_cached_after_first_fetch(self):
        result1 = await get_stock_history("GOOGL")
        result2 = await get_stock_history("GOOGL")
        assert result1 is result2

    @pytest.mark.asyncio
    async def test_history_cache_key_includes_symbol(self):
        await get_stock_history("TSLA")
        assert _cache_get("history:TSLA") is not None

    @pytest.mark.asyncio
    async def test_history_normalizes_symbol_to_uppercase(self):
        result = await get_stock_history("aapl")
        assert result is not None
        assert result.symbol == "AAPL"

    @pytest.mark.asyncio
    async def test_history_mock_flag_is_true_without_api_key(self):
        """Without ALPHA_VANTAGE_API_KEY, should use mock data."""
        result = await get_stock_history("AAPL")
        assert result is not None
        assert result.mock is True

    @pytest.mark.asyncio
    async def test_history_uses_cache_over_fresh_fetch(self):
        """Pre-populate cache and verify subsequent calls skip mock data loading."""
        cached = StockHistory(
            symbol="AMZN",
            name="Amazon cached",
            data=[DataPoint(date="2024-01-01", close=99.0)],
            mock=False,
        )
        _cache_set("history:AMZN", cached, ttl=60)

        result = await get_stock_history("AMZN")
        assert result is cached
        assert result.name == "Amazon cached"


# ---- get_batch_history tests ----

class TestGetBatchHistory:
    @pytest.mark.asyncio
    async def test_returns_dict_of_histories(self):
        result = await get_batch_history(["AAPL", "MSFT"])
        assert isinstance(result, dict)

    @pytest.mark.asyncio
    async def test_result_contains_all_known_symbols(self):
        result = await get_batch_history(["AAPL", "MSFT"])
        assert "AAPL" in result
        assert "MSFT" in result

    @pytest.mark.asyncio
    async def test_skips_unknown_symbols_silently(self):
        result = await get_batch_history(["AAPL", "UNKNOWNXYZ"])
        assert "AAPL" in result
        assert "UNKNOWNXYZ" not in result

    @pytest.mark.asyncio
    async def test_empty_input_returns_empty_dict(self):
        result = await get_batch_history([])
        assert result == {}

    @pytest.mark.asyncio
    async def test_batch_normalizes_symbols_to_uppercase(self):
        result = await get_batch_history(["aapl"])
        assert "AAPL" in result

    @pytest.mark.asyncio
    async def test_no_delay_when_no_api_key(self):
        """Without Alpha Vantage key, no 12s delay should occur."""
        import time as time_module
        start = time_module.monotonic()
        await get_batch_history(["AAPL", "MSFT", "GOOGL"])
        elapsed = time_module.monotonic() - start
        # Should complete in well under 1 second without API key
        assert elapsed < 5.0
