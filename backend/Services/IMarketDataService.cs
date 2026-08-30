using InstrumentDashboard.Api.Models;

namespace InstrumentDashboard.Api.Services;

public interface IMarketDataService
{
    IReadOnlyList<string> GetInstruments();
    PriceSeriesResponse? GetPrices(string ticker);
    InstrumentStats? GetStats(string ticker);
}
