# Stock Market Trends

Dark-mode webapp displaying 10-year stock market trends in a draggable grid layout.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12+-3776AB?logo=python&logoColor=white)

## Features

- **10-year trend charts** for top stocks using TradingView Lightweight Charts
- **Draggable grid** (5x2 on 1080p) with reordering via dnd-kit
- **Side panel** with searchable stock list and checkboxes to toggle visibility
- **Scrollable overflow** when adding more than 10 stocks
- **Mock data included** -- works out of the box, no API key required
- **Dark minimalist theme**

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Docker

```bash
docker compose up --build
```

Open http://localhost

## Project Structure

```
frontend/          React + TypeScript + Vite
  src/
    components/    AppShell, StockGrid, StockCard, SidePanel
    hooks/         useStocks, useDragAndDrop, useGridLayout
    lib/           API client, types, constants

backend/           Python + FastAPI
  app/
    routes/        Stock endpoints
    services/      Stock data fetching + caching
    schemas/       Pydantic models
    data/          Bundled mock stock data
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `ALPHA_VANTAGE_API_KEY` | API key for live stock data | None (uses mock data) |
| `VITE_API_BASE_URL` | Backend URL for production | `/api` (Vite proxy) |

## Tests

```bash
# Frontend
cd frontend && npm test

# Backend
cd backend && python -m pytest -v
```
