using System.Text.Json;
using Costasdev.VigoTransitApi.Types;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace Costasdev.Busurbano.Backend;

[ApiController]
[Route("api/santiago")]
public class SantiagoController : ControllerBase
{
    private readonly IMemoryCache _cache;
    private readonly HttpClient _httpClient;

    public SantiagoController(HttpClient http, IMemoryCache cache)
    {
        _cache = cache;
        _httpClient = http;
    }

    [HttpGet("GetStopEstimates")]
    public async Task<IActionResult> Run()
    {
        var argumentAvailable = Request.Query.TryGetValue("id", out var requestedStopIdString);
        if (!argumentAvailable)
        {
            return BadRequest("Please provide a stop id as a query parameter with the name 'id'.");
        }

        var argumentNumber = int.TryParse(requestedStopIdString, out var requestedStopId);
        if (!argumentNumber)
        {
            return BadRequest("The provided stop id is not a valid number.");
        }

        try
        {
            var obj = await _httpClient.GetFromJsonAsync<JsonDocument>(
                $"https://app.tussa.org/tussa/api/paradas/{requestedStopId}");

            if (obj is null)
            {
                return BadRequest("No response returned from the API, or whatever");
            }

            var root = obj.RootElement;

            List<StopEstimate> estimates = root
                .GetProperty("lineas")
                .EnumerateArray()
                .Select(el => new StopEstimate(
                    el.GetProperty("sinoptico").GetString() ?? string.Empty,
                    el.GetProperty("nombre").GetString() ?? string.Empty,
                    el.GetProperty("minutosProximoPaso").GetInt32(),
                    0
                )).ToList();

            // Return only the estimates array, not the stop metadata
            return new OkObjectResult(estimates);
        }
        catch (InvalidOperationException)
        {
            return new BadRequestObjectResult("Stop not found");
        }
    }

    [HttpGet("GetStopTimetable")]
    public async Task<IActionResult> GetStopTimetable()
    {
        throw new NotImplementedException();
    }
}
