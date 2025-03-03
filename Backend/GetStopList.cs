using Microsoft.Azure.Functions.Worker;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Costasdev.VigoTransitApi;

namespace Costasdev.UrbanoVigoWeb;

public class GetStopList
{
    private readonly VigoTransitApiClient _api;

    public GetStopList(HttpClient http)
    {
        _api = new VigoTransitApiClient(http);
    }

    [Function("GetStopList")]
    public async Task<IActionResult> Run([HttpTrigger(AuthorizationLevel.Anonymous, "get")] HttpRequest req)
    {
        try
        {
            var stops = await _api.GetStops();
            return new OkObjectResult(stops);
        }
        catch (InvalidOperationException)
        {
            return new BadRequestObjectResult("Failed to retrieve stops");
        }
    }
}

