namespace InstrumentDashboard.Api.Models;

public sealed record PriceSeriesResponse(
    string Ticker,
    IReadOnlyList<PricePoint> Prices);
