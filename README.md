# Instrument Price Dashboard

Small full-stack application built with React and C#/ASP.NET Core. 
It loads the supplied synthetic market data CSV, exposes instrument/price/statistics APIs, and provides a dashboard for browsing and comparing instruments.

## Features

- Browse all 200 tickers and search as you type.
- View a 30-day price chart for a selected ticker.
- Display total return, daily volatility, and maximum drawdown.
- Compare 2–3 instruments on one chart.
- Loading, API error, and unknown-ticker handling.
 
## Project structure

- backend/ — ASP.NET Core Web API targeting .NET 8
- frontend/ — React + TypeScript + Vite frontend using Recharts

## Run locally

### 1. Backend

Requires .NET 8 SDK

```bash
cd backend
dotnet build
dotnet run
```
The included launch settings run the API at: http://localhost:5058

API endpoints:

GET /api/instruments
GET /api/prices/{ticker}
GET /api/prices/{ticker}/stats

Run the backend unit tests from the repository root:

```bash
dotnet test backend.tests
```

### 2. Frontend

Requires Node.js 20.19+ or 22.12+.
```bash
cd frontend
npm install
npm run dev
```
Open: http://localhost:5173

The frontend defaults to `http://localhost:5058` for the API. 

Run the frontend tests:

```bash
npm test
```

## Statistics interpretation

- **Total return %**: `(last price / first price - 1) * 100`.
- **Daily volatility**: sample standard deviation (`N - 1`) of simple daily returns, expressed as a percentage.
- **Maximum drawdown**: largest peak-to-trough decline during the period, returned as a negative percentage.

## Implementation notes

### Backend

- The CSV is parsed once when the backend starts and held as read-only in-memory market data.
- `IMarketDataService` is registered as a singleton because the supplied data is static for the lifetime of the application.
- Price observations are sorted by date before being exposed through the API.

### Frontend

- Price and statistics requests for the current selection are made concurrently.
- The React API layer uses `AbortSignal` support so in-flight requests can be cancelled during effect cleanup.
- Successfully loaded prices and statistics are cached by ticker for the browser session. Because the supplied dataset is static, reselecting a ticker reuses its cached data rather than making an identical API request; a live-data source would require a freshness or revalidation policy.
- For multi-selection, price series are overlaid using their raw prices as requested. Statistics are shown for every selected ticker.

## AI assistance

AI coding assistance was used to accelerate familiarity with C#/.NET and ASP.NET Core syntax and conventions, as my primary production backend experience is Java/Spring Boot. It was also used to support the Recharts integration, which was a new library for me, and to help refine the frontend styling, responsive layout, and user experience.

I reviewed, adapted, tested, and validated the final implementation and can explain the architecture, application-design decisions, and tradeoffs across both the backend and frontend.
