namespace InstrumentDashboard.Api.Models;

public sealed record InstrumentStats(
    string Ticker,
    double TotalReturnPercent,
    double DailyVolatilityPercent,
    double MaxDrawdownPercent);
