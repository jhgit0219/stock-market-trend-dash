"""Tests for Pydantic schema validation and serialization."""
import pytest
from pydantic import ValidationError

from app.schemas.stock import (
    StockInfo,
    StockListResponse,
    DataPoint,
    StockHistory,
    BatchHistoryRequest,
    BatchHistoryResponse,
    ErrorDetail,
    ErrorResponse,
)


class TestStockInfo:
    def test_valid_stock_info_creates_model(self):
        stock = StockInfo(symbol="AAPL", name="Apple Inc.", sector="Technology")
        assert stock.symbol == "AAPL"
        assert stock.name == "Apple Inc."
        assert stock.sector == "Technology"

    def test_stock_info_serializes_to_dict(self):
        stock = StockInfo(symbol="MSFT", name="Microsoft", sector="Technology")
        d = stock.model_dump()
        assert d == {"symbol": "MSFT", "name": "Microsoft", "sector": "Technology"}

    def test_stock_info_requires_symbol(self):
        with pytest.raises(ValidationError):
            StockInfo(name="Apple", sector="Technology")  # type: ignore[call-arg]

    def test_stock_info_requires_name(self):
        with pytest.raises(ValidationError):
            StockInfo(symbol="AAPL", sector="Technology")  # type: ignore[call-arg]

    def test_stock_info_requires_sector(self):
        with pytest.raises(ValidationError):
            StockInfo(symbol="AAPL", name="Apple")  # type: ignore[call-arg]


class TestStockListResponse:
    def test_valid_response_creates_model(self):
        stocks = [StockInfo(symbol="AAPL", name="Apple", sector="Tech")]
        resp = StockListResponse(stocks=stocks)
        assert len(resp.stocks) == 1

    def test_empty_stocks_list_is_valid(self):
        resp = StockListResponse(stocks=[])
        assert resp.stocks == []

    def test_serializes_to_dict_with_stocks_key(self):
        resp = StockListResponse(stocks=[])
        d = resp.model_dump()
        assert "stocks" in d
        assert d["stocks"] == []


class TestDataPoint:
    def test_valid_data_point_creates_model(self):
        dp = DataPoint(date="2024-01-01", close=185.5)
        assert dp.date == "2024-01-01"
        assert dp.close == 185.5

    def test_close_accepts_integer(self):
        dp = DataPoint(date="2024-01-01", close=200)
        assert dp.close == 200.0

    def test_data_point_requires_date(self):
        with pytest.raises(ValidationError):
            DataPoint(close=100.0)  # type: ignore[call-arg]

    def test_data_point_requires_close(self):
        with pytest.raises(ValidationError):
            DataPoint(date="2024-01-01")  # type: ignore[call-arg]

    def test_serializes_correctly(self):
        dp = DataPoint(date="2024-06-01", close=99.99)
        d = dp.model_dump()
        assert d == {"date": "2024-06-01", "close": 99.99}


class TestStockHistory:
    def test_valid_stock_history_creates_model(self):
        history = StockHistory(
            symbol="AAPL",
            name="Apple Inc.",
            data=[DataPoint(date="2024-01-01", close=185.0)],
            mock=True,
        )
        assert history.symbol == "AAPL"
        assert len(history.data) == 1

    def test_mock_defaults_to_true(self):
        history = StockHistory(symbol="AAPL", name="Apple", data=[])
        assert history.mock is True

    def test_mock_can_be_set_to_false(self):
        history = StockHistory(symbol="AAPL", name="Apple", data=[], mock=False)
        assert history.mock is False

    def test_empty_data_is_valid(self):
        history = StockHistory(symbol="AAPL", name="Apple", data=[])
        assert history.data == []

    def test_serializes_all_fields(self):
        history = StockHistory(
            symbol="MSFT",
            name="Microsoft",
            data=[DataPoint(date="2024-01-01", close=400.0)],
            mock=True,
        )
        d = history.model_dump()
        assert "symbol" in d
        assert "name" in d
        assert "data" in d
        assert "mock" in d


class TestBatchHistoryRequest:
    def test_valid_request_with_single_symbol(self):
        req = BatchHistoryRequest(symbols=["AAPL"])
        assert req.symbols == ["AAPL"]

    def test_valid_request_with_10_symbols(self):
        # Symbols must match ^[A-Z.]{1,10}$ — use real ticker-style values
        symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "JPM", "V", "JNJ"]
        req = BatchHistoryRequest(symbols=symbols)
        assert len(req.symbols) == 10

    def test_rejects_more_than_10_symbols(self):
        # Symbols must match ^[A-Z.]{1,10}$ — use real ticker-style values
        symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "JPM", "V", "JNJ", "EXTRA"]
        with pytest.raises(ValidationError) as exc_info:
            BatchHistoryRequest(symbols=symbols)
        # Pydantic raises a too_long error when max_length is exceeded
        assert "11" in str(exc_info.value)

    def test_empty_symbols_list_is_accepted(self):
        req = BatchHistoryRequest(symbols=[])
        assert req.symbols == []

    def test_requires_symbols_field(self):
        with pytest.raises(ValidationError):
            BatchHistoryRequest()  # type: ignore[call-arg]


class TestBatchHistoryResponse:
    def test_valid_response_with_empty_results(self):
        resp = BatchHistoryResponse(results={})
        assert resp.results == {}

    def test_valid_response_with_histories(self):
        history = StockHistory(symbol="AAPL", name="Apple", data=[], mock=True)
        resp = BatchHistoryResponse(results={"AAPL": history})
        assert "AAPL" in resp.results


class TestErrorDetail:
    def test_valid_error_detail(self):
        detail = ErrorDetail(code="STOCK_NOT_FOUND", message="No data found")
        assert detail.code == "STOCK_NOT_FOUND"
        assert detail.message == "No data found"

    def test_serializes_to_dict(self):
        detail = ErrorDetail(code="RATE_LIMIT", message="Too many requests")
        d = detail.model_dump()
        assert d == {"code": "RATE_LIMIT", "message": "Too many requests"}


class TestErrorResponse:
    def test_valid_error_response(self):
        detail = ErrorDetail(code="STOCK_NOT_FOUND", message="Symbol not found")
        resp = ErrorResponse(error=detail)
        assert resp.error.code == "STOCK_NOT_FOUND"

    def test_serializes_nested_error(self):
        detail = ErrorDetail(code="NOT_FOUND", message="No data")
        resp = ErrorResponse(error=detail)
        d = resp.model_dump()
        assert "error" in d
        assert d["error"]["code"] == "NOT_FOUND"
