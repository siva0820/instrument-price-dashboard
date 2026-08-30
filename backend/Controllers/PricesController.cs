using InstrumentDashboard.Api.Models;
using InstrumentDashboard.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace InstrumentDashboard.Api.Controllers;

[ApiController]
[Route("api/prices")]
public sealed class PricesController(IMarketDataService marketDataService) : ControllerBase
{
    [HttpGet("{ticker}")]
    public ActionResult<PriceSeriesResponse> GetPrices(string ticker)
    {
        var result = marketDataService.GetPrices(ticker);

        return result is null
            ? NotFound(new { message = $"Unknown ticker '{ticker}'." })
            : Ok(result);
    }

    [HttpGet("{ticker}/stats")]
    public ActionResult<InstrumentStats> GetStats(string ticker)
    {
        var result = marketDataService.GetStats(ticker);

        return result is null
            ? NotFound(new { message = $"Unknown ticker '{ticker}'." })
            : Ok(result);
    }
}
