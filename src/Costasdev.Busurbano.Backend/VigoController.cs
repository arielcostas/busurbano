using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Costasdev.VigoTransitApi;
using System.Text.Json;

namespace Costasdev.Busurbano.Backend;

[ApiController]
[Route("api/vigo")]
public class VigoController : ControllerBase
{
    private readonly VigoTransitApiClient _api;
    private readonly IMemoryCache _cache;
    private readonly HttpClient _httpClient;

    public VigoController(HttpClient http, IMemoryCache cache)
    {
        _api = new VigoTransitApiClient(http);
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
            var response = await _api.GetStopEstimates(requestedStopId);
            // Return only the estimates array, not the stop metadata
            return new OkObjectResult(response.Estimates);
        }
        catch (InvalidOperationException)
        {
            return BadRequest("Stop not found");
        }
    }

    [HttpGet("GetStopTimetable")]
    public async Task<IActionResult> GetStopTimetable()
    {
        // Get date parameter (default to today if not provided)
        var dateString = Request.Query.TryGetValue("date", out var requestedDate)
            ? requestedDate.ToString()
            : DateTime.Today.ToString("yyyy-MM-dd");

        // Validate date format
        if (!DateTime.TryParseExact(dateString, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out _))
        {
            return BadRequest("Invalid date format. Please use yyyy-MM-dd format.");
        }

        // Get stopId parameter
        if (!Request.Query.TryGetValue("stopId", out var requestedStopIdString))
        {
            return BadRequest("Please provide a stop id as a query parameter with the name 'stopId'.");
        }

        if (!int.TryParse(requestedStopIdString, out var requestedStopId))
        {
            return BadRequest("The provided stop id is not a valid number.");
        }

        // Create cache key
        var cacheKey = $"timetable_{dateString}_{requestedStopId}";

        // Try to get from cache first
        if (_cache.TryGetValue(cacheKey, out var cachedData))
        {
            return new OkObjectResult(cachedData);
        }

        try
        {
            // Fetch data from external API
            var url = $"https://costas.dev/static-storage/vitrasa_svc/stops/{dateString}/{requestedStopId}.json";
            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    return NotFound($"Timetable data not found for stop {requestedStopId} on {dateString}");
                }
                return StatusCode((int)response.StatusCode, "Error fetching timetable data");
            }

            var jsonContent = await response.Content.ReadAsStringAsync();
            var timetableData = JsonSerializer.Deserialize<JsonElement>(jsonContent);

            // Cache the data for 12 hours
            var cacheOptions = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(12),
                SlidingExpiration = TimeSpan.FromHours(6), // Refresh cache if accessed within 6 hours of expiry
                Priority = CacheItemPriority.Normal
            };

            _cache.Set(cacheKey, timetableData, cacheOptions);

            return new OkObjectResult(timetableData);
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(500, $"Error fetching timetable data: {ex.Message}");
        }
        catch (JsonException ex)
        {
            return StatusCode(500, $"Error parsing timetable data: {ex.Message}");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Unexpected error: {ex.Message}");
        }
    }
}

