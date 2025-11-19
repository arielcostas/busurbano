using System.Globalization;
using System.Text;
using System.Text.Json;
using Costasdev.Busurbano.Backend.Configuration;
using Costasdev.Busurbano.Backend.Services;
using Costasdev.Busurbano.Backend.Types;
using Costasdev.VigoTransitApi;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using static Costasdev.Busurbano.Backend.Types.StopArrivals.Types;
using SysFile = System.IO.File;

namespace Costasdev.Busurbano.Backend.Controllers;

[ApiController]
[Route("api/vigo")]
public class VigoController : ControllerBase
{
    private readonly ILogger<VigoController> _logger;
    private readonly VigoTransitApiClient _api;
    private readonly AppConfiguration _configuration;
    private readonly ShapeTraversalService _shapeService;

    public VigoController(HttpClient http, IOptions<AppConfiguration> options, ILogger<VigoController> logger, ShapeTraversalService shapeService)
    {
        _logger = logger;
        _api = new VigoTransitApiClient(http);
        _configuration = options.Value;
        _shapeService = shapeService;
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
        [FromQuery] string? date = null
    )
    {
        // Use Europe/Madrid timezone to determine the correct date
        var tz = TimeZoneInfo.FindSystemTimeZoneById("Europe/Madrid");
        var nowLocal = TimeZoneInfo.ConvertTime(DateTime.UtcNow, tz);

        // If no date provided or date is "today", use Madrid timezone's current date
        string effectiveDate;
        if (string.IsNullOrEmpty(date) || date == "today")
        {
            effectiveDate = nowLocal.Date.ToString("yyyy-MM-dd");
        }
        else
        {
            // Validate provided date format
            if (!DateTime.TryParseExact(date, "yyyy-MM-dd", null, DateTimeStyles.None, out _))
            {
                return BadRequest("Invalid date format. Please use yyyy-MM-dd format.");
            }
            effectiveDate = date;
        }

        try
        {
            var file = Path.Combine(_configuration.ScheduleBasePath, effectiveDate, stopId + ".json");
            if (!SysFile.Exists(file))
            {
                throw new FileNotFoundException();
            }

            var contents = await SysFile.ReadAllTextAsync(file);

            return new OkObjectResult(JsonSerializer.Deserialize<List<ScheduledStop>>(contents)!);
        }
        catch (FileNotFoundException ex)
        {
            _logger.LogError(ex, "Stop data not found for stop {StopId} on date {Date}", stopId, effectiveDate);
            return StatusCode(404, $"Stop data not found for stop {stopId} on date {effectiveDate}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading stop data");
            return StatusCode(500, "Error loading timetable");
        }
    }

    [HttpGet("GetConsolidatedCirculations")]
    public async Task<IActionResult> GetConsolidatedCirculations(
        [FromQuery] int stopId
    )
    {
        // Use Europe/Madrid timezone consistently to avoid UTC/local skew
        var tz = TimeZoneInfo.FindSystemTimeZoneById("Europe/Madrid");
        var nowLocal = TimeZoneInfo.ConvertTime(DateTime.UtcNow, tz);

        var realtimeTask = _api.GetStopEstimates(stopId);
        var todayDate = nowLocal.Date.ToString("yyyy-MM-dd");
        var tomorrowDate = nowLocal.Date.AddDays(1).ToString("yyyy-MM-dd");

        // Load both today's and tomorrow's schedules to handle night services
        var timetableTask = LoadStopArrivalsProto(stopId.ToString(), todayDate);

        // Wait for real-time data and today's schedule (required)
        await Task.WhenAll(realtimeTask, timetableTask);

        var realTimeEstimates = realtimeTask.Result.Estimates;

        // Handle case where schedule file doesn't exist - return realtime-only data
        if (timetableTask.Result == null)
        {
            _logger.LogWarning("No schedule data available for stop {StopId} on {Date}, returning realtime-only data", stopId, todayDate);

            var realtimeOnlyCirculations = realTimeEstimates.Select(estimate => new ConsolidatedCirculation
            {
                Line = estimate.Line,
                Route = estimate.Route,
                Schedule = null,
                RealTime = new RealTimeData
                {
                    Minutes = estimate.Minutes,
                    Distance = estimate.Meters
                }
            }).OrderBy(c => c.RealTime!.Minutes).ToList();

            return Ok(realtimeOnlyCirculations);
        }

        var timetable = timetableTask.Result.Arrivals
            .Where(c => c.StartingDateTime() != null && c.CallingDateTime() != null)
            .ToList();

        var stopLocation = timetableTask.Result.Location;

        var now = nowLocal.AddSeconds(60 - nowLocal.Second);
        // Define the scope end as the time of the last realtime arrival (no extra buffer)
        var scopeEnd = realTimeEstimates.Count > 0
            ? now.AddMinutes(Math.Min(realTimeEstimates.Max(e => e.Minutes) + 5, 75))
            : now.AddMinutes(60); // If no estimates, show next hour of scheduled only

        List<ConsolidatedCirculation> consolidatedCirculations = [];
        var usedTripIds = new HashSet<string>();

        foreach (var estimate in realTimeEstimates)
        {
            var estimatedArrivalTime = now.AddMinutes(estimate.Minutes);

            var possibleCirculations = timetable
                .Where(c =>
                {
                    // Match by line number
                    if (c.Line.Trim() != estimate.Line.Trim())
                        return false;

                    // Match by route (destination) - compare with both Route field and Terminus stop name
                    // Normalize both sides: remove non-ASCII-alnum characters and lowercase
                    var estimateRoute = NormalizeRouteName(estimate.Route);
                    var scheduleRoute = NormalizeRouteName(c.Route);
                    var scheduleTerminus = NormalizeRouteName(c.TerminusName);

                    return scheduleRoute == estimateRoute || scheduleTerminus == estimateRoute;
                })
                .OrderBy(c => c.CallingDateTime()!.Value)
                .ToArray();

            ScheduledArrival? closestCirculation = null;

            // Matching strategy:
            // 1) Prefer a started trip whose scheduled calling time is close to the estimated arrival.
            // 2) If no good started match, pick the next not-started trip (soonest in the future).
            // 3) Reject matches where scheduled time is >10 minutes AFTER realtime (data inconsistency).
            // 4) Fallbacks: if no future trips, use the best started one even if far.
            const int startedMatchToleranceMinutes = 15; // how close a started trip must be to consider it a match
            const int maxScheduleDelayMinutes = 10; // reject if scheduled is this much later than realtime

            var startedCandidates = possibleCirculations
                .Where(c => c.StartingDateTime()!.Value <= now)
                .Select(c => new
                {
                    Circulation = c,
                    AbsDiff = Math.Abs((estimatedArrivalTime - c.CallingDateTime()!.Value).TotalMinutes),
                    TimeDiff = (c.CallingDateTime()!.Value - estimatedArrivalTime).TotalMinutes // positive if scheduled is later
                })
                .OrderBy(x => x.AbsDiff)
                .ToList();

            var bestStarted = startedCandidates.FirstOrDefault();

            var futureCandidates = possibleCirculations
                .Where(c => c.StartingDateTime()!.Value > now)
                .Select(c => new
                {
                    Circulation = c,
                    TimeDiff = (c.CallingDateTime()!.Value - estimatedArrivalTime).TotalMinutes
                })
                .ToList();

            // Check best started candidate
            if (bestStarted != null &&
                bestStarted.AbsDiff <= startedMatchToleranceMinutes &&
                bestStarted.TimeDiff <= maxScheduleDelayMinutes) // reject if scheduled too far after realtime
            {
                closestCirculation = bestStarted.Circulation;
            }
            else if (futureCandidates.Count > 0)
            {
                // Pick the soonest upcoming trip, but reject if it's scheduled too far after realtime
                var soonest = futureCandidates.First();
                if (soonest.TimeDiff <= maxScheduleDelayMinutes)
                {
                    closestCirculation = soonest.Circulation;
                }
                // Otherwise, leave it null (no valid match)
            }
            else if (bestStarted != null && bestStarted.TimeDiff <= maxScheduleDelayMinutes)
            {
                // nothing upcoming today; fallback to the closest started one (if timing is reasonable)
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

                continue;
            }

            // Ensure each scheduled trip is only matched once to a realtime estimate
            if (usedTripIds.Contains(closestCirculation.TripId))
            {
                _logger.LogInformation("Skipping duplicate realtime match for TripId {TripId}", closestCirculation.TripId);
                continue;
            }

            var isRunning = closestCirculation.StartingDateTime()!.Value <= now;
            Position? currentPosition = null;

            // Calculate bus position only for realtime trips that have already departed
            if (isRunning && !string.IsNullOrEmpty(closestCirculation.ShapeId))
            {
                var shape = await _shapeService.LoadShapeAsync(closestCirculation.ShapeId);
                if (shape != null && stopLocation != null)
                {
                    currentPosition = _shapeService.GetBusPosition(shape, stopLocation, estimate.Meters);
                }
            }

            consolidatedCirculations.Add(new ConsolidatedCirculation
            {
                Line = estimate.Line,
                Route = estimate.Route,
                NextStreets = [.. closestCirculation.NextStreets],
                Schedule = new ScheduleData
                {
                    Running = isRunning,
                    Minutes = (int)(closestCirculation.CallingDateTime()!.Value - now).TotalMinutes,
                    TripId = closestCirculation.TripId,
                    ServiceId = closestCirculation.ServiceId,
                },
                RealTime = new RealTimeData
                {
                    Minutes = estimate.Minutes,
                    Distance = estimate.Meters
                },
                CurrentPosition = currentPosition
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

    private async Task<StopArrivals?> LoadStopArrivalsProto(string stopId, string dateString)
    {
        var file = Path.Combine(_configuration.ScheduleBasePath, dateString, stopId + ".pb");
        if (!SysFile.Exists(file))
        {
            _logger.LogWarning("Stop arrivals proto file not found: {File}", file);
            return null;
        }

        var contents = await SysFile.ReadAllBytesAsync(file);
        var stopArrivals = StopArrivals.Parser.ParseFrom(contents);
        return stopArrivals;
    }

    private async Task<Shape> LoadShapeProto(string shapeId)
    {
        var file = Path.Combine(_configuration.ScheduleBasePath, shapeId + ".pb");
        if (!SysFile.Exists(file))
        {
            throw new FileNotFoundException();
        }

        var contents = await SysFile.ReadAllBytesAsync(file);
        var shape = Shape.Parser.ParseFrom(contents);
        return shape;
    }

    private static string NormalizeRouteName(string route)
    {
        var normalized = route.Trim().ToLowerInvariant();
        // Remove diacritics/accents first, then filter to alphanumeric
        normalized = RemoveDiacritics(normalized);
        return new string(normalized.Where(char.IsLetterOrDigit).ToArray());
    }

    private static string RemoveDiacritics(string text)
    {
        var normalizedString = text.Normalize(NormalizationForm.FormD);
        var stringBuilder = new StringBuilder();

        foreach (var c in normalizedString)
        {
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != UnicodeCategory.NonSpacingMark)
            {
                stringBuilder.Append(c);
            }
        }

        return stringBuilder.ToString().Normalize(NormalizationForm.FormC);
    }
}

public static class StopScheduleExtensions
{
    public static DateTime? StartingDateTime(this ScheduledArrival stop)
    {
        return ParseGtfsTime(stop.StartingTime);
    }

    public static DateTime? CallingDateTime(this ScheduledArrival stop)
    {
        return ParseGtfsTime(stop.CallingTime);
    }

    /// <summary>
    /// Parse GTFS time format (HH:MM:SS) which can have hours >= 24 for services past midnight
    /// </summary>
    private static DateTime? ParseGtfsTime(string timeStr)
    {
        if (string.IsNullOrWhiteSpace(timeStr))
        {
            return null;
        }

        var parts = timeStr.Split(':');
        if (parts.Length != 3)
        {
            return null;
        }

        if (!int.TryParse(parts[0], out var hours) ||
            !int.TryParse(parts[1], out var minutes) ||
            !int.TryParse(parts[2], out var seconds))
        {
            return null;
        }

        // Handle GTFS times that exceed 24 hours (e.g., 25:30:00 for 1:30 AM next day)
        var days = hours / 24;
        var normalizedHours = hours % 24;

        try
        {
            var dt = DateTime.Today
                .AddDays(days)
                .AddHours(normalizedHours)
                .AddMinutes(minutes)
                .AddSeconds(seconds);
            return dt.AddSeconds(60 - dt.Second);
        }
        catch
        {
            return null;
        }
    }
}
