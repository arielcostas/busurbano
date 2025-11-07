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

    [HttpGet("GetConsolidatedCirculations")]
    public async Task<IActionResult> GetConsolidatedCirculations(
        [FromQuery] int stopId
    )
    {
        StringBuilder outputBuffer = new();

        // Use Europe/Madrid timezone consistently to avoid UTC/local skew
        var tz = TimeZoneInfo.FindSystemTimeZoneById("Europe/Madrid");
        var nowLocal = TimeZoneInfo.ConvertTime(DateTime.UtcNow, tz);

        var realtimeTask = _api.GetStopEstimates(stopId);
        var timetableTask = LoadTimetable(stopId.ToString(), nowLocal.Date.ToString("yyyy-MM-dd"));

        await Task.WhenAll(realtimeTask, timetableTask);

        var realTimeEstimates = realtimeTask.Result.Estimates;
        // Filter out records with unparseable times (e.g., hours >= 24)
        var timetable = timetableTask.Result
            .Where(c => c.StartingDateTime() != null && c.CallingDateTime() != null)
            .ToList();

        var now = nowLocal.AddSeconds(60 - nowLocal.Second);
        // Define the scope end as the time of the last realtime arrival (no extra buffer)
        var lastEstimateArrivalMinutes = realTimeEstimates.Max(e => e.Minutes);
        var scopeEnd = realTimeEstimates.Count > 0
            ? now.AddMinutes(Math.Min(lastEstimateArrivalMinutes + 5, 75))
            : now.AddMinutes(60); // If no estimates, show next hour of scheduled only

        List<ConsolidatedCirculation> consolidatedCirculations = [];
        var usedTripIds = new HashSet<string>();

        foreach (var estimate in realTimeEstimates)
        {
            var estimatedArrivalTime = now.AddMinutes(estimate.Minutes);

            var possibleCirculations = timetable
                .Where(c =>
                    c.Line.Trim() == estimate.Line.Trim() &&
                    c.Route.Trim() == estimate.Route.Trim()
                )
                .OrderBy(c => c.CallingDateTime()!.Value)
                .ToArray();

            ScheduledStop? closestCirculation = null;

            // Matching strategy:
            // 1) Prefer a started trip whose scheduled calling time is close to the estimated arrival.
            // 2) If no good started match, pick the next not-started trip (soonest in the future).
            // 3) Fallbacks: if no future trips, use the best started one even if far.
            const int startedMatchToleranceMinutes = 15; // how close a started trip must be to consider it a match

            var startedCandidates = possibleCirculations
                .Where(c => c.StartingDateTime()!.Value <= now)
                .Select(c => new
                {
                    Circulation = c,
                    AbsDiff = Math.Abs((estimatedArrivalTime - c.CallingDateTime()!.Value).TotalMinutes)
                })
                .OrderBy(x => x.AbsDiff)
                .ToList();

            var bestStarted = startedCandidates.FirstOrDefault();

            var futureCandidates = possibleCirculations
                .Where(c => c.StartingDateTime()!.Value > now)
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
                // No scheduled match: include realtime-only entry
                _logger.LogWarning("No schedule match for realtime line {Line} towards {Route} in {Minutes} minutes", estimate.Line, estimate.Route, estimate.Minutes);
                consolidatedCirculations.Add(new ConsolidatedCirculation
                {
                    Line = estimate.Line,
                    Route = estimate.Route,
                    Schedule = null,
                    RealTime = new RealTimeData
                    {
                        Minutes = estimate.Minutes,
                        Distance = estimate.Meters
                    }
                });

                // Also capture details in debug buffer for diagnostics
                outputBuffer.AppendLine("**No circulation matched. List of all of them:**");
                foreach (var circulation in possibleCirculations)
                {
                    outputBuffer.AppendLine(
                        $"Circulation {circulation.TripId} stopping at {circulation.CallingDateTime()!.Value} (diff: {estimatedArrivalTime - circulation.CallingDateTime()!.Value:HH:mm})");
                }

                outputBuffer.AppendLine();

                continue;
            }

            // Ensure each scheduled trip is only matched once to a realtime estimate
            if (usedTripIds.Contains(closestCirculation.TripId))
            {
                _logger.LogInformation("Skipping duplicate realtime match for TripId {TripId}", closestCirculation.TripId);
                continue;
            }

            consolidatedCirculations.Add(new ConsolidatedCirculation
            {
                Line = estimate.Line,
                Route = estimate.Route,
                Schedule = new ScheduleData
                {
                    Running = closestCirculation.StartingDateTime()!.Value <= now,
                    Minutes = (int)(closestCirculation.CallingDateTime()!.Value - now).TotalMinutes,
                    TripId = closestCirculation.TripId,
                    ServiceId = closestCirculation.ServiceId,
                },
                RealTime = new RealTimeData
                {
                    Minutes = estimate.Minutes,
                    Distance = estimate.Meters
                }
            });

            usedTripIds.Add(closestCirculation.TripId);
        }

        // Add scheduled-only circulations between now and the last realtime arrival
        if (scopeEnd > now)
        {
            var matchedTripIds = new HashSet<string>(usedTripIds);

            var scheduledWindow = timetable
                .Where(c => c.CallingDateTime()!.Value >= now && c.CallingDateTime()!.Value <= scopeEnd)
                .OrderBy(c => c.CallingDateTime()!.Value);

            foreach (var sched in scheduledWindow)
            {
                if (matchedTripIds.Contains(sched.TripId))
                {
                    continue; // already represented via a matched realtime
                }

                consolidatedCirculations.Add(new ConsolidatedCirculation
                {
                    Line = sched.Line,
                    Route = sched.Route,
                    Schedule = new ScheduleData
                    {
                        Running = sched.StartingDateTime()!.Value <= now,
                        Minutes = (int)(sched.CallingDateTime()!.Value - now).TotalMinutes,
                        TripId = sched.TripId,
                        ServiceId = sched.ServiceId,
                    },
                    RealTime = null
                });
            }
        }

        // Sort by ETA (RealTime minutes if present; otherwise Schedule minutes)
        var sorted = consolidatedCirculations
            .OrderBy(c => c.RealTime?.Minutes ?? c.Schedule!.Minutes)
            .ToList();

        return Ok(sorted);
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
