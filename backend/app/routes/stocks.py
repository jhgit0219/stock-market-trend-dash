import asyncio
import logging
from typing import Annotated

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import Field

from app.schemas.stock import (
    StockListResponse,
    StockHistory,
    BatchHistoryRequest,
    BatchHistoryResponse,
    ErrorResponse,
    ErrorDetail,
    StockSymbol,
)
from app.services import stock_service
from app.core.limiter import limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/stocks", tags=["stocks"])

# SEC-008/SEC-010: limit concurrent batch requests to prevent async worker starvation
_batch_semaphore = asyncio.Semaphore(3)


@router.get(
    "",
    response_model=StockListResponse,
    summary="List all available stocks",
)
@limiter.limit("30/minute")
def list_stocks(request: Request) -> StockListResponse:
    # SEC-007: log incoming request path and client IP at INFO level
    logger.info("GET /api/stocks from %s", request.client.host if request.client else "unknown")
    stocks = stock_service.get_stock_list()
    return StockListResponse(stocks=stocks)


@router.get(
    "/{symbol}/history",
    response_model=StockHistory,
    responses={404: {"model": ErrorResponse}},
    summary="Get 10-year monthly history for a stock",
)
@limiter.limit("30/minute")
async def stock_history(
    request: Request,
    symbol: Annotated[str, Field(pattern=r"^[A-Z.]{1,10}$")],
) -> StockHistory:
    # SEC-007: log incoming request
    logger.info(
        "GET /api/stocks/%s/history from %s",
        symbol,
        request.client.host if request.client else "unknown",
    )

    # SEC-002: path param validated by Pydantic pattern; uppercasing handled in service
    history = await stock_service.get_stock_history(symbol)
    if not history:
        # SEC-014: use generic message — do not echo raw user input
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "STOCK_NOT_FOUND", "message": "Stock not found"},
        )
    return history


@router.post(
    "/batch-history",
    response_model=BatchHistoryResponse,
    summary="Get histories for multiple stocks (up to 10)",
)
@limiter.limit("5/minute")
async def batch_history(request: Request, body: BatchHistoryRequest) -> BatchHistoryResponse:
    # SEC-007: log incoming batch request
    logger.info(
        "POST /api/stocks/batch-history (%d symbols) from %s",
        len(body.symbols),
        request.client.host if request.client else "unknown",
    )

    # SEC-008/SEC-010: refuse if semaphore is exhausted (return 429)
    if _batch_semaphore.locked() and _batch_semaphore._value == 0:  # type: ignore[attr-defined]
        logger.warning(
            "Batch semaphore exhausted — rejecting request from %s",
            request.client.host if request.client else "unknown",
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "TOO_MANY_REQUESTS", "message": "Too many concurrent batch requests, please retry later"},
        )

    async with _batch_semaphore:
        results = await stock_service.get_batch_history(body.symbols)

    return BatchHistoryResponse(results=results)
