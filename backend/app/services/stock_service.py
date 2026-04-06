import json
import time
import asyncio
import logging
from collections import OrderedDict
from pathlib import Path
from typing import Optional
import httpx

from app.core.config import settings
from app.schemas.stock import StockInfo, StockHistory, DataPoint

logger = logging.getLogger(__name__)

# SEC-003: hardcoded, non-configurable Alpha Vantage base URL to prevent SSRF
ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query"

# SEC-006: maximum number of entries allowed in the in-memory cache
_CACHE_MAX_SIZE = 100

# ---- Mock data loading ----

_MOCK_DATA_PATH = Path(__file__).parent.parent / "data" / "mock_stocks.json"
_mock_data: dict = {}


def _load_mock_data() -> dict:
    global _mock_data
    if not _mock_data:
        with open(_MOCK_DATA_PATH) as f:
            _mock_data = json.load(f)
    return _mock_data


def _get_valid_symbols() -> set[str]:
    """Return the set of symbols present in mock data (used as the allowlist)."""
    return set(_load_mock_data().keys())


# ---- In-memory cache (bounded, LRU-style via OrderedDict) ----

class CacheEntry:
    def __init__(self, value: object, ttl: int):
        self.value = value
        self.expires_at = time.monotonic() + ttl

    def is_valid(self) -> bool:
        return time.monotonic() < self.expires_at


# SEC-006: use OrderedDict so we can evict the oldest entry (insertion order)
_cache: OrderedDict[str, CacheEntry] = OrderedDict()


def _cache_get(key: str) -> Optional[object]:
    entry = _cache.get(key)
    if entry and entry.is_valid():
        # Move to end to mark as recently used
        _cache.move_to_end(key)
        return entry.value
    if entry:
        del _cache[key]
    return None


def _cache_set(key: str, value: object, ttl: int) -> None:
    if key in _cache:
        _cache.move_to_end(key)
    _cache[key] = CacheEntry(value, ttl)
    # SEC-006: evict oldest entry when cache exceeds max size
    while len(_cache) > _CACHE_MAX_SIZE:
        oldest_key, _ = next(iter(_cache.items()))
        logger.debug("Cache full — evicting oldest entry: %s", oldest_key)
        del _cache[oldest_key]


# ---- Stock list ----

def get_stock_list() -> list[StockInfo]:
    cached = _cache_get("stock_list")
    if cached:
        return cached  # type: ignore[return-value]

    mock = _load_mock_data()
    stocks = [
        StockInfo(symbol=v["symbol"], name=v["name"], sector=v["sector"])
        for v in mock.values()
    ]

    _cache_set("stock_list", stocks, settings.list_cache_ttl_seconds)
    return stocks


# ---- Stock history ----

def _mock_history(symbol: str) -> Optional[StockHistory]:
    mock = _load_mock_data()
    entry = mock.get(symbol.upper())
    if not entry:
        return None
    return StockHistory(
        symbol=entry["symbol"],
        name=entry["name"],
        data=[DataPoint(date=d["date"], close=d["close"]) for d in entry["data"]],
        mock=True,
    )


async def _fetch_alpha_vantage(symbol: str) -> Optional[StockHistory]:
    """Fetch monthly adjusted data from Alpha Vantage."""
    if not settings.alpha_vantage_api_key:
        return None

    params = {
        "function": "TIME_SERIES_MONTHLY_ADJUSTED",
        "symbol": symbol,
        "apikey": settings.alpha_vantage_api_key,
    }

    try:
        # SEC-003: use hardcoded constant, not configurable setting
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=False) as client:
            resp = await client.get(ALPHA_VANTAGE_BASE_URL, params=params)
            resp.raise_for_status()
            raw = resp.json()

        ts = raw.get("Monthly Adjusted Time Series")
        if not ts:
            # SEC-007: log quota/warning-level events clearly
            logger.warning(
                "Alpha Vantage returned no time-series data for %s — possible quota exhaustion: %s",
                symbol,
                raw,
            )
            return None

        meta = raw.get("Meta Data", {})
        name = meta.get("2. Symbol", symbol)

        # Parse last 10 years (120 months)
        sorted_dates = sorted(ts.keys())[-120:]
        data_points = [
            DataPoint(date=d, close=float(ts[d]["5. adjusted close"]))
            for d in sorted_dates
        ]

        return StockHistory(symbol=symbol.upper(), name=name, data=data_points, mock=False)

    except Exception as exc:
        logger.error("Alpha Vantage fetch failed for %s: %s", symbol, exc)
        return None


async def get_stock_history(symbol: str) -> Optional[StockHistory]:
    sym = symbol.upper()

    # SEC-006: only cache/look up symbols that exist in the mock data allowlist
    valid_symbols = _get_valid_symbols()
    if sym not in valid_symbols:
        # SEC-007: log invalid/unknown symbol attempts
        logger.warning("Symbol not in allowlist, rejecting without cache/upstream call: %s", sym)
        return None

    cache_key = f"history:{sym}"

    cached = _cache_get(cache_key)
    if cached:
        return cached  # type: ignore[return-value]

    # SEC-007: log cache misses at DEBUG level
    logger.debug("Cache miss for symbol: %s", sym)

    # Try Alpha Vantage first
    live = await _fetch_alpha_vantage(sym)
    if live:
        _cache_set(cache_key, live, settings.history_cache_ttl_seconds)
        return live

    # Fall back to mock data
    mock = _mock_history(sym)
    if mock:
        _cache_set(cache_key, mock, settings.history_cache_ttl_seconds)
        return mock

    return None


async def get_batch_history(
    symbols: list[str],
) -> dict[str, StockHistory]:
    """Fetch histories for multiple symbols. Respects AV rate limits."""
    results: dict[str, StockHistory] = {}

    for i, symbol in enumerate(symbols):
        sym = symbol.upper()
        history = await get_stock_history(sym)
        if history:
            results[sym] = history

        # Respect Alpha Vantage 5 req/min limit when making live calls
        if settings.alpha_vantage_api_key and i < len(symbols) - 1:
            await asyncio.sleep(12)  # 12s between calls = 5/min

    return results
