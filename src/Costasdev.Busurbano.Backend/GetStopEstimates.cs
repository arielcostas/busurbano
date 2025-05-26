using Microsoft.AspNetCore.Mvc;
using Costasdev.VigoTransitApi;

namespace Costasdev.Busurbano.Backend;

[ApiController]
[Route("api")]
public class ApiController : ControllerBase
{
    private readonly VigoTransitApiClient _api;

    public ApiController(HttpClient http)
    {
        _api = new VigoTransitApiClient(http);
    }

    [HttpGet("GetStopEstimates")]
    public async Task<IActionResult> Run()
    {
        var argumentAvailable = Request.Query.TryGetValue("id", out var requestedStopIdString);
        if (!argumentAvailable)
        {
            return new BadRequestObjectResult("Please provide a stop id");
        }

        var argumentNumber = int.TryParse(requestedStopIdString, out var requestedStopId);
        if (!argumentNumber)
        {
            return new BadRequestObjectResult("Please provide a valid stop id");
        }

        try
        {
            var estimates = await _api.GetStopEstimates(requestedStopId);
            return new OkObjectResult(estimates);
        }
        catch (InvalidOperationException)
        {
            return new BadRequestObjectResult("Stop not found");
        }
    }
}

