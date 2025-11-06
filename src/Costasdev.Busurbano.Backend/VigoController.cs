using System.Globalization;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Costasdev.VigoTransitApi;
using System.Text.Json;
using Costasdev.Busurbano.Backend.Types;
using Costasdev.VigoTransitApi.Types;

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
    public async Task<IActionResult> Run(
        [FromQuery] int id
    )
    {
        try
        {
            var response = await _api.GetStopEstimates(id);
            // Return only the estimates array, not the stop metadata
            return new OkObjectResult(response.Estimates);
        }
        catch (InvalidOperationException)
        {
            return BadRequest("Stop not found");
        }
    }

    [HttpGet("GetStopTimetable")]
    public async Task<IActionResult> GetStopTimetable(
        [FromQuery] int stopId,
        [FromQuery] string date
        )
    {
        // Validate date format
        if (!DateTime.TryParseExact(date, "yyyy-MM-dd", null, DateTimeStyles.None, out _))
        {
            return BadRequest("Invalid date format. Please use yyyy-MM-dd format.");
        }

        // Create cache key
        var cacheKey = $"timetable_{date}_{stopId}";

        // Try to get from cache first
        if (_cache.TryGetValue(cacheKey, out var cachedData))
        {
            Response.Headers.Append("App-CacheUsage", "HIT");
            return new OkObjectResult(cachedData);
        }

        try
        {
            var timetableData = await LoadTimetable(stopId.ToString(), date);

            // Cache the data for 12 hours
            var cacheOptions = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(12),
                SlidingExpiration = TimeSpan.FromHours(6), // Refresh cache if accessed within 6 hours of expiry
                Priority = CacheItemPriority.Normal
            };

            _cache.Set(cacheKey, timetableData, cacheOptions);

            Response.Headers.Append("App-CacheUsage", "MISS");
            return new OkObjectResult(timetableData);
        }
        catch (HttpRequestException ex)
        {
            return StatusCode((int?)ex.StatusCode ?? 500, $"Error fetching timetable data: {ex.Message}");
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

    /*private StopEstimate[] LoadDebugEstimates()
    {
        var file = @"C:\Users\ariel\Desktop\GetStopEstimates.json";
        var contents = System.IO.File.ReadAllText(file);
        return JsonSerializer.Deserialize<StopEstimate[]>(contents, JsonSerializerOptions.Web)!;
    }

    private ScheduledStop[] LoadDebugTimetable()
    {
        var file = @"C:\Users\ariel\Desktop\GetStopTimetable.json";
        var contents = System.IO.File.ReadAllText(file);
        return JsonSerializer.Deserialize<ScheduledStop[]>(contents)!;
    }*/

    [HttpGet("GetStopArrivalsMerged")]
    public async Task<IActionResult> GetStopArrivalsMerged(
        [FromQuery] int stopId
    )
    {
        StringBuilder outputBuffer = new();

        var now = DateTime.Now.AddSeconds(60 -  DateTime.Now.Second);
        var realtimeTask = _api.GetStopEstimates(stopId);
        var timetableTask = LoadTimetable(stopId.ToString(), now.ToString("yyyy-MM-dd"));

        Task.WaitAll(realtimeTask, timetableTask);

        var realTimeEstimates = realtimeTask.Result.Estimates;
        var timetable = timetableTask.Result;

        /*var now = DateTime.Today.AddHours(17).AddMinutes(59);
        var realTimeEstimates = LoadDebugEstimates();
        var timetable = LoadDebugTimetable();*/

        foreach (var estimate in realTimeEstimates)
        {
            outputBuffer.AppendLine($"Parsing estimate with line={estimate.Line}, route={estimate.Route} and minutes={estimate.Minutes} - Arrives at {now.AddMinutes(estimate.Minutes):HH:mm}");
            var fullArrivalTime = now.AddMinutes(estimate.Minutes);

            var possibleCirculations = timetable
                .Where(c => c.Line.Name.Trim() == estimate.Line.Trim() && c.Trip.Headsign.Trim() == estimate.Route.Trim())
                .OrderBy(c => c.DepartureDateTime())
                .ToArray();

            outputBuffer.AppendLine($"Found {possibleCirculations.Length} potential circulations");

            ScheduledStop? closestCirculation = null;
            int closestCirculationTime = int.MaxValue;

            foreach (var circulation in possibleCirculations)
            {
                var diffBetweenScheduleAndTrip = (int)Math.Round((fullArrivalTime - circulation.DepartureDateTime()).TotalMinutes);
                var diffBetweenNowAndSchedule = (int)(fullArrivalTime - now).TotalMinutes;

                var tolerance = Math.Max(2, diffBetweenNowAndSchedule * 0.15); // Positive amount of minutes
                if (diffBetweenScheduleAndTrip <= -tolerance)
                {
                    break;
                }

                if (diffBetweenScheduleAndTrip < closestCirculationTime)
                {
                    closestCirculation = circulation;
                    closestCirculationTime = diffBetweenScheduleAndTrip;
                }

            }

            if (closestCirculation == null)
            {
                outputBuffer.AppendLine("**No circulation matched. List of all of them:**");
                foreach (var circulation in possibleCirculations)
                {
                    // Circulation A  03LP000_008003_16 stopping at 05/11/2025 22:06:00 (diff: -03:29:59.2644092)
                    outputBuffer.AppendLine($"Circulation {circulation.Trip.Id} stopping at {circulation.DepartureDateTime()} (diff: {fullArrivalTime - circulation.DepartureDateTime():HH:mm})");
                }
                outputBuffer.AppendLine();

                continue;
            }

            if (closestCirculationTime > 0)
            {
                outputBuffer.Append($"Closest circulation is {closestCirculation.Trip.Id} and arriving {closestCirculationTime} minutes LATE");
            }
            else if (closestCirculationTime == 0)
            {
                outputBuffer.Append($"Closest circulation is {closestCirculation.Trip.Id} and arriving ON TIME");
            }
            else
            {
                outputBuffer.Append($"Closest circulation is {closestCirculation.Trip.Id} and arriving {Math.Abs(closestCirculationTime)} minutes EARLY");
            }

            outputBuffer.AppendLine(
                $" -- Circulation expected at {closestCirculation.DepartureDateTime():HH:mm)}");

            outputBuffer.AppendLine();
        }

        return Ok(outputBuffer.ToString());
    }

    private async Task<List<ScheduledStop>> LoadTimetable(string stopId, string dateString)
    {
        var url = $"https://www.costas.dev/static-storage/vitrasa_svc/stops/{dateString}/{stopId}.json";
        var response = await _httpClient.GetAsync(url);

        response.EnsureSuccessStatusCode();

        var jsonContent = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<List<ScheduledStop>>(jsonContent) ?? [];
    }
}
