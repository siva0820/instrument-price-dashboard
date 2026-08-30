using InstrumentDashboard.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace InstrumentDashboard.Api.Controllers;

[ApiController]
[Route("api/instruments")]
public sealed class InstrumentsController(IMarketDataService marketDataService) : ControllerBase
{
    [HttpGet]
    public ActionResult<IReadOnlyList<string>> GetInstruments()
    {
        return Ok(marketDataService.GetInstruments());
    }
}
