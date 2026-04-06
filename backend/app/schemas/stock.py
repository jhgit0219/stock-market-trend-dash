from pydantic import BaseModel, Field, field_validator
from typing import Annotated, Optional


# Validated stock symbol: 1-10 uppercase letters or dots (e.g. BRK.B)
StockSymbol = Annotated[str, Field(pattern=r"^[A-Z.]{1,10}$")]


class StockInfo(BaseModel):
    symbol: str
    name: str
    sector: str


class StockListResponse(BaseModel):
    stocks: list[StockInfo]


class DataPoint(BaseModel):
    date: str
    close: float


class StockHistory(BaseModel):
    symbol: str
    name: str
    data: list[DataPoint]
    mock: bool = True


class BatchHistoryRequest(BaseModel):
    symbols: list[StockSymbol] = Field(..., max_length=10)

    @field_validator("symbols")
    @classmethod
    def max_ten_symbols(cls, v: list) -> list:
        if len(v) > 10:
            raise ValueError("Maximum 10 symbols per batch request")
        return v


class BatchHistoryResponse(BaseModel):
    results: dict[str, StockHistory]


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorDetail
