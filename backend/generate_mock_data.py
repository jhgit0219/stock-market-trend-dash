"""
Script to generate realistic mock stock data for bundling with the backend.
Run once: python generate_mock_data.py
"""
import json
import math
import random
from datetime import date, timedelta

random.seed(42)

STOCKS = [
    {"symbol": "AAPL", "name": "Apple Inc.", "sector": "Technology",
     "start": 28.0, "end": 185.0, "volatility": 0.06},
    {"symbol": "MSFT", "name": "Microsoft Corporation", "sector": "Technology",
     "start": 38.0, "end": 375.0, "volatility": 0.055},
    {"symbol": "GOOGL", "name": "Alphabet Inc.", "sector": "Technology",
     "start": 55.0, "end": 140.0, "volatility": 0.065},
    {"symbol": "AMZN", "name": "Amazon.com Inc.", "sector": "Consumer Discretionary",
     "start": 18.0, "end": 178.0, "volatility": 0.08},
    {"symbol": "NVDA", "name": "NVIDIA Corporation", "sector": "Technology",
     "start": 4.5, "end": 495.0, "volatility": 0.10},
    {"symbol": "META", "name": "Meta Platforms Inc.", "sector": "Technology",
     "start": 26.0, "end": 485.0, "volatility": 0.09},
    {"symbol": "TSLA", "name": "Tesla Inc.", "sector": "Consumer Discretionary",
     "start": 2.5, "end": 245.0, "volatility": 0.14},
    {"symbol": "BRK.B", "name": "Berkshire Hathaway B", "sector": "Financials",
     "start": 110.0, "end": 365.0, "volatility": 0.04},
    {"symbol": "JPM", "name": "JPMorgan Chase & Co.", "sector": "Financials",
     "start": 52.0, "end": 195.0, "volatility": 0.06},
    {"symbol": "V", "name": "Visa Inc.", "sector": "Financials",
     "start": 62.0, "end": 265.0, "volatility": 0.05},
    {"symbol": "JNJ", "name": "Johnson & Johnson", "sector": "Healthcare",
     "start": 88.0, "end": 155.0, "volatility": 0.04},
    {"symbol": "WMT", "name": "Walmart Inc.", "sector": "Consumer Staples",
     "start": 52.0, "end": 165.0, "volatility": 0.04},
    {"symbol": "PG", "name": "Procter & Gamble Co.", "sector": "Consumer Staples",
     "start": 68.0, "end": 155.0, "volatility": 0.035},
    {"symbol": "MA", "name": "Mastercard Inc.", "sector": "Financials",
     "start": 78.0, "end": 450.0, "volatility": 0.055},
    {"symbol": "HD", "name": "The Home Depot Inc.", "sector": "Consumer Discretionary",
     "start": 62.0, "end": 375.0, "volatility": 0.055},
    {"symbol": "UNH", "name": "UnitedHealth Group Inc.", "sector": "Healthcare",
     "start": 65.0, "end": 535.0, "volatility": 0.05},
    {"symbol": "XOM", "name": "Exxon Mobil Corporation", "sector": "Energy",
     "start": 90.0, "end": 108.0, "volatility": 0.07},
    {"symbol": "LLY", "name": "Eli Lilly and Company", "sector": "Healthcare",
     "start": 52.0, "end": 780.0, "volatility": 0.08},
    {"symbol": "AVGO", "name": "Broadcom Inc.", "sector": "Technology",
     "start": 48.0, "end": 1280.0, "volatility": 0.09},
    {"symbol": "PFE", "name": "Pfizer Inc.", "sector": "Healthcare",
     "start": 28.0, "end": 27.0, "volatility": 0.06},
    {"symbol": "KO", "name": "The Coca-Cola Company", "sector": "Consumer Staples",
     "start": 38.0, "end": 61.0, "volatility": 0.03},
    {"symbol": "COST", "name": "Costco Wholesale Corp.", "sector": "Consumer Staples",
     "start": 110.0, "end": 780.0, "volatility": 0.055},
    {"symbol": "ABBV", "name": "AbbVie Inc.", "sector": "Healthcare",
     "start": 35.0, "end": 168.0, "volatility": 0.065},
    {"symbol": "MCD", "name": "McDonald's Corporation", "sector": "Consumer Discretionary",
     "start": 90.0, "end": 295.0, "volatility": 0.04},
    {"symbol": "AMD", "name": "Advanced Micro Devices", "sector": "Technology",
     "start": 3.5, "end": 165.0, "volatility": 0.13},
    {"symbol": "NFLX", "name": "Netflix Inc.", "sector": "Technology",
     "start": 52.0, "end": 610.0, "volatility": 0.11},
    {"symbol": "DIS", "name": "The Walt Disney Company", "sector": "Communication Services",
     "start": 78.0, "end": 95.0, "volatility": 0.07},
    {"symbol": "PYPL", "name": "PayPal Holdings Inc.", "sector": "Financials",
     "start": 38.0, "end": 62.0, "volatility": 0.12},
    {"symbol": "INTC", "name": "Intel Corporation", "sector": "Technology",
     "start": 28.0, "end": 34.0, "volatility": 0.08},
    {"symbol": "CRM", "name": "Salesforce Inc.", "sector": "Technology",
     "start": 48.0, "end": 285.0, "volatility": 0.09},
]


def generate_price_series(start: float, end: float, n: int, volatility: float) -> list[float]:
    """Generate a realistic log-normal price series with drift toward end price."""
    prices = [start]
    log_start = math.log(start)
    log_end = math.log(end)
    drift = (log_end - log_start) / n

    for i in range(1, n):
        shock = random.gauss(0, volatility)
        log_price = math.log(prices[-1]) + drift + shock
        prices.append(math.exp(log_price))

    # Clamp the last value to be close to target
    prices[-1] = end
    return prices


def generate_dates(n: int) -> list[str]:
    """Generate n monthly dates ending ~today."""
    end_date = date(2024, 12, 1)
    dates = []
    for i in range(n - 1, -1, -1):
        # Go back i months
        month = end_date.month - i
        year = end_date.year
        while month <= 0:
            month += 12
            year -= 1
        dates.append(f"{year:04d}-{month:02d}-01")
    return dates


def main():
    n_points = 120  # 10 years monthly
    dates = generate_dates(n_points)

    result = {}
    for stock in STOCKS:
        prices = generate_price_series(
            stock["start"], stock["end"], n_points, stock["volatility"]
        )
        data_points = [
            {"date": d, "close": round(p, 2)}
            for d, p in zip(dates, prices)
        ]
        result[stock["symbol"]] = {
            "symbol": stock["symbol"],
            "name": stock["name"],
            "sector": stock["sector"],
            "data": data_points,
        }

    with open("app/data/mock_stocks.json", "w") as f:
        json.dump(result, f, indent=2)

    print(f"Generated mock data for {len(result)} stocks with {n_points} data points each.")


if __name__ == "__main__":
    main()
