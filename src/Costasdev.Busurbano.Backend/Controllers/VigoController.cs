using System.Globalization;
using System.Text;
using System.Text.Json;
using Costasdev.Busurbano.Backend.Configuration;
using Costasdev.Busurbano.Backend.Types;
using Costasdev.VigoTransitApi;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using SysFile = System.IO.File;

namespace Costasdev.Busurbano.Backend.Controllers;

[ApiController]
[Route("api/vigo")]
public class VigoController : ControllerBase
{
    private readonly  ILogger<VigoController> _logger;
    private readonly VigoTransitApiClient _api;
    private readonly AppConfiguration  _configuration;

    public VigoController(HttpClient http, IOptions<AppConfiguration> options, ILogger<VigoController> logger)
    {
        _logger = logger;
        _api = new VigoTransitApiClient(http);
        _configuration = options.Value;
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

        try
        {
            var timetableData = await LoadTimetable(stopId.ToString(), date);

            return new OkObjectResult(timetableData);
        }
        catch (FileNotFoundException ex)
        {
            _logger.LogError(ex, "Stop data not found for stop {StopId} on date {Date}", stopId, date);
            return StatusCode(404, $"Stop data not found for stop {stopId} on date {date}");
        }
        catch(Exception ex)
        {
            _logger.LogError(ex, "Error loading stop data");
            return StatusCode(500, "Error loading timetable");
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

        await Task.WhenAll(realtimeTask, timetableTask);

        var realTimeEstimates = realtimeTask.Result.Estimates;
        var timetable = timetableTask.Result;

        foreach (var estimate in realTimeEstimates)
        {
            outputBuffer.AppendLine($"Parsing estimate with line={estimate.Line}, route={estimate.Route} and minutes={estimate.Minutes} - Arrives at {now.AddMinutes(estimate.Minutes):HH:mm}");
            var fullArrivalTime = now.AddMinutes(estimate.Minutes);

            var possibleCirculations = timetable
                .Where(c => c.Line.Trim() == estimate.Line.Trim() && c.Route.Trim() == estimate.Route.Trim())
                .OrderBy(c => c.CallingDateTime())
                .ToArray();

            outputBuffer.AppendLine($"Found {possibleCirculations.Length} potential circulations");

            ScheduledStop? closestCirculation = null;
            int closestCirculationTime = int.MaxValue;

            foreach (var circulation in possibleCirculations)
            {
                var diffBetweenScheduleAndTrip = (int)Math.Round((fullArrivalTime - circulation.CallingDateTime()).TotalMinutes);
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
                    outputBuffer.AppendLine($"Circulation {circulation.TripId} stopping at {circulation.CallingDateTime()} (diff: {fullArrivalTime - circulation.CallingDateTime():HH:mm})");
                }
                outputBuffer.AppendLine();

                continue;
            }

            if (closestCirculationTime > 0)
            {
                outputBuffer.Append($"Closest circulation is {closestCirculation.TripId} and arriving {closestCirculationTime} minutes LATE");
            }
            else if (closestCirculationTime == 0)
            {
                outputBuffer.Append($"Closest circulation is {closestCirculation.TripId} and arriving ON TIME");
            }
            else
            {
                outputBuffer.Append($"Closest circulation is {closestCirculation.TripId} and arriving {Math.Abs(closestCirculationTime)} minutes EARLY");
            }

            outputBuffer.AppendLine(
                $" -- Circulation expected at {closestCirculation.CallingDateTime():HH:mm)}");

            outputBuffer.AppendLine();
        }

        return Ok(outputBuffer.ToString());
    }

    private async Task<List<ScheduledStop>> LoadTimetable(string stopId, string dateString)
    {
        var file = Path.Combine(_configuration.ScheduleBasePath, dateString, stopId + ".json");
        if (!SysFile.Exists(file))
        {
            throw new FileNotFoundException();
        }
        var contents = await SysFile.ReadAllTextAsync(file);
        return JsonSerializer.Deserialize<List<ScheduledStop>>(contents)!;
    }
}
