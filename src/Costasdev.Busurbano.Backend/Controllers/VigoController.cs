using System.Globalization;
using System.Text;
using System.Text.Json;
using Costasdev.Busurbano.Backend.Configuration;
using Costasdev.Busurbano.Backend.Types;
using Costasdev.VigoTransitApi;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using SysFile = System.IO.File;

namespace Costasdev.Busurbano.Backend.Controllers;

[ApiController]
[Route("api/vigo")]
public class VigoController : ControllerBase
{
    private readonly ILogger<VigoController> _logger;
    private readonly VigoTransitApiClient _api;
    private readonly AppConfiguration _configuration;

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
        catch (Exception ex)
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

        var realtimeTask = _api.GetStopEstimates(stopId);
        var timetableTask = LoadTimetable(stopId.ToString(), DateTime.Today.ToString("yyyy-MM-dd"));

        await Task.WhenAll(realtimeTask, timetableTask);

        var realTimeEstimates = realtimeTask.Result.Estimates;
        var timetable = timetableTask.Result;

        var now = DateTime.Now.AddSeconds(60 - DateTime.Now.Second);
        var endOfScope = now.AddMinutes(
            realTimeEstimates.OrderByDescending(e => e.Minutes).First().Minutes + 10
        );

        List<ConsolidatedCirculation> consolidatedCirculations = [];

        foreach (var estimate in realTimeEstimates)
        {
            var estimatedArrivalTime = now.AddMinutes(estimate.Minutes);

            var possibleCirculations = timetable
                .Where(c =>
                    c.Line.Trim() == estimate.Line.Trim() &&
                    c.Route.Trim() == estimate.Route.Trim()
                )
                .OrderBy(c => c.CallingDateTime())
                .ToArray();

            ScheduledStop? closestCirculation = null;

            // Matching strategy:
            // 1) Prefer a started trip whose scheduled calling time is close to the estimated arrival.
            // 2) If no good started match, pick the next not-started trip (soonest in the future).
            // 3) Fallbacks: if no future trips, use the best started one even if far.
            const int startedMatchToleranceMinutes = 15; // how close a started trip must be to consider it a match

            var startedCandidates = possibleCirculations
                .Where(c => c.StartingDateTime() <= now)
                .Select(c => new
                {
                    Circulation = c,
                    AbsDiff = Math.Abs((estimatedArrivalTime - c.CallingDateTime()).TotalMinutes)
                })
                .OrderBy(x => x.AbsDiff)
                .ToList();

            var bestStarted = startedCandidates.FirstOrDefault();

            var futureCandidates = possibleCirculations
                .Where(c => c.StartingDateTime() > now)
                .ToList();

            if (bestStarted != null && bestStarted.AbsDiff <= startedMatchToleranceMinutes)
            {
                closestCirculation = bestStarted.Circulation;
            }
            else if (futureCandidates.Count > 0)
            {
                // pick the soonest upcoming trip for this line/route
                closestCirculation = futureCandidates.First();
            }
            else if (bestStarted != null)
            {
                // nothing upcoming today; fallback to the closest started one (even if far)
                closestCirculation = bestStarted.Circulation;
            }

            if (closestCirculation == null)
            {
                _logger.LogError("No stop arrival merged for line {Line} towards {Route} in {Minutes} minutes", estimate.Line, estimate.Route, estimate.Minutes);
                outputBuffer.AppendLine("**No circulation matched. List of all of them:**");
                foreach (var circulation in possibleCirculations)
                {
                    // Circulation A  03LP000_008003_16 stopping at 05/11/2025 22:06:00 (diff: -03:29:59.2644092)
                    outputBuffer.AppendLine(
                        $"Circulation {circulation.TripId} stopping at {circulation.CallingDateTime()} (diff: {estimatedArrivalTime - circulation.CallingDateTime():HH:mm})");
                }

                outputBuffer.AppendLine();

                continue;
            }

            consolidatedCirculations.Add(new ConsolidatedCirculation
            {
                Line = estimate.Line,
                Route = estimate.Route,
                Schedule = new ScheduleData
                {
                    Running = closestCirculation.StartingDateTime() <= now,
                    Minutes = (int)(closestCirculation.CallingDateTime() - now).TotalMinutes,
                    TripId = closestCirculation.TripId,
                    ServiceId = closestCirculation.ServiceId,
                },
                RealTime = new RealTimeData
                {
                    Minutes = estimate.Minutes,
                    Distance = estimate.Meters,
                    Confidence = closestCirculation.StartingDateTime() <= now
                        ? RealTimeConfidence.High
                        : RealTimeConfidence.Low
                }
            });
        }

        return Ok(consolidatedCirculations);
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
