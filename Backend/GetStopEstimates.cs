using Microsoft.Azure.Functions.Worker;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Costasdev.VigoTransitApi;

namespace Costasdev.UrbanoVigoWeb;

public class GetStopEstimates
{
    private readonly VigoTransitApiClient _api;

    public GetStopEstimates(HttpClient http)
    {
        _api = new VigoTransitApiClient(http);
    }

    [Function("GetStopEstimates")]
    public async Task<IActionResult> Run([HttpTrigger(AuthorizationLevel.Anonymous, "get")] HttpRequest req)
    {
        var argumentAvailable = req.Query.TryGetValue("id", out var requestedStopIdString);
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

