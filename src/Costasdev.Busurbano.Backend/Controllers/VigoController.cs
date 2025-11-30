using System.Globalization;
using System.Text;
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
public partial class VigoController : ControllerBase
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

    [HttpGet("GetShape")]
    public async Task<IActionResult> GetShape(
        [FromQuery] string shapeId,
        [FromQuery] int? startPointIndex = null,
        [FromQuery] double? busLat = null,
        [FromQuery] double? busLon = null,
        [FromQuery] int? busShapeIndex = null,
        [FromQuery] double? stopLat = null,
        [FromQuery] double? stopLon = null,
        [FromQuery] int? stopShapeIndex = null
    )
    {
        var path = await _shapeService.GetShapePathAsync(shapeId, 0);
        if (path == null)
        {
            return NotFound();
        }

        // Determine bus point
        object? busPoint = null;
        if (busShapeIndex.HasValue && busShapeIndex.Value >= 0 && busShapeIndex.Value < path.Count)
        {
            var p = path[busShapeIndex.Value];
            busPoint = new { lat = p.Latitude, lon = p.Longitude, index = busShapeIndex.Value };
        }
        else if (busLat.HasValue && busLon.HasValue)
        {
            var idx = await _shapeService.FindClosestPointIndexAsync(shapeId, busLat.Value, busLon.Value);
            if (idx.HasValue && idx.Value >= 0 && idx.Value < path.Count)
            {
                var p = path[idx.Value];
                busPoint = new { lat = p.Latitude, lon = p.Longitude, index = idx.Value };
            }
        }
        else if (startPointIndex.HasValue && startPointIndex.Value >= 0 && startPointIndex.Value < path.Count)
        {
            var p = path[startPointIndex.Value];
            busPoint = new { lat = p.Latitude, lon = p.Longitude, index = startPointIndex.Value };
        }

        // Determine stop point
        object? stopPoint = null;
        if (stopShapeIndex.HasValue && stopShapeIndex.Value >= 0 && stopShapeIndex.Value < path.Count)
        {
            var p = path[stopShapeIndex.Value];
            stopPoint = new { lat = p.Latitude, lon = p.Longitude, index = stopShapeIndex.Value };
        }
        else if (stopLat.HasValue && stopLon.HasValue)
        {
            var idx = await _shapeService.FindClosestPointIndexAsync(shapeId, stopLat.Value, stopLon.Value);
            if (idx.HasValue && idx.Value >= 0 && idx.Value < path.Count)
            {
                var p = path[idx.Value];
                stopPoint = new { lat = p.Latitude, lon = p.Longitude, index = idx.Value };
            }
        }

        // Convert to GeoJSON LineString
        var coordinates = path.Select(p => new[] { p.Longitude, p.Latitude }).ToList();

        var geoJson = new
        {
            type = "Feature",
            geometry = new
            {
                type = "LineString",
                coordinates = coordinates
            },
            properties = new
            {
                busPoint,
                stopPoint
            }
        };

        return Ok(geoJson);
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
            .Where(c => c.StartingDateTime(nowLocal.Date) != null && c.CallingDateTime(nowLocal.Date) != null)
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
                .OrderBy(c => c.CallingDateTime(nowLocal.Date)!.Value)
                .ToArray();

            ScheduledArrival? closestCirculation = null;

            // Matching strategy:
            // 1) Filter trips that are not "too early" (TimeDiff <= 7).
            //    TimeDiff = Schedule - Realtime.
            //    If TimeDiff > 7, bus is > 7 mins early. Reject.
            // 2) From the valid trips, pick the one with smallest Abs(TimeDiff).
            //    This handles "as late as it gets" (large negative TimeDiff) by preferring smaller delays if available,
            //    but accepting large delays if that's the only option (and better than an invalid early trip).
            const int maxEarlyArrivalMinutes = 7;

            var bestMatch = possibleCirculations
                .Select(c => new
                {
                    Circulation = c,
                    TimeDiff = (c.CallingDateTime(nowLocal.Date)!.Value - estimatedArrivalTime).TotalMinutes
                })
                .Where(x => x.TimeDiff <= maxEarlyArrivalMinutes)
                .OrderBy(x => Math.Abs(x.TimeDiff))
                .FirstOrDefault();

            if (bestMatch != null)
            {
                closestCirculation = bestMatch.Circulation;
            }

            if (closestCirculation == null)
            {
                // No scheduled match: include realtime-only entry
                _logger.LogWarning("No schedule match for realtime line {Line} towards {Route} in {Minutes} minutes (tried matching {NormalizedRoute})", estimate.Line, estimate.Route, estimate.Minutes, NormalizeRouteName(estimate.Route));
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

            var isRunning = closestCirculation.StartingDateTime(nowLocal.Date)!.Value <= now;
            Position? currentPosition = null;
            int? stopShapeIndex = null;
            bool usePreviousShape = false;

            // Calculate bus position for realtime trips
            if (!string.IsNullOrEmpty(closestCirculation.ShapeId))
            {
                // Check if we are likely on the previous trip
                // If the bus is further away than the distance from the start of the trip to the stop,
                // it implies the bus is on the previous trip (or earlier).
                double distOnPrevTrip = estimate.Meters - closestCirculation.ShapeDistTraveled;
                usePreviousShape = !isRunning &&
                                        !string.IsNullOrEmpty(closestCirculation.PreviousTripShapeId) &&
                                        distOnPrevTrip > 0;

                if (usePreviousShape)
                {
                    var prevShape = await _shapeService.LoadShapeAsync(closestCirculation.PreviousTripShapeId);
                    if (prevShape != null && prevShape.Points.Count > 0)
                    {
                        // The bus is on the previous trip.
                        // We treat the end of the previous shape as the "stop" for the purpose of calculation.
                        // The distance to traverse backwards from the end of the previous shape is 'distOnPrevTrip'.
                        var lastPoint = prevShape.Points[prevShape.Points.Count - 1];
                        var result = _shapeService.GetBusPosition(prevShape, lastPoint, (int)distOnPrevTrip);
                        currentPosition = result.BusPosition;
                        stopShapeIndex = result.StopIndex;
                    }
                }
                else
                {
                    // Normal case: bus is on the current trip shape
                    var shape = await _shapeService.LoadShapeAsync(closestCirculation.ShapeId);
                    if (shape != null && stopLocation != null)
                    {
                        var result = _shapeService.GetBusPosition(shape, stopLocation, estimate.Meters);
                        currentPosition = result.BusPosition;
                        stopShapeIndex = result.StopIndex;
                    }
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
                    Minutes = (int)(closestCirculation.CallingDateTime(nowLocal.Date)!.Value - now).TotalMinutes,
                    TripId = closestCirculation.TripId,
                    ServiceId = closestCirculation.ServiceId,
                    ShapeId = closestCirculation.ShapeId,
                },
                RealTime = new RealTimeData
                {
                    Minutes = estimate.Minutes,
                    Distance = estimate.Meters
                },
                CurrentPosition = currentPosition,
                StopShapeIndex = stopShapeIndex,
                IsPreviousTrip = usePreviousShape,
                PreviousTripShapeId = usePreviousShape ? closestCirculation.PreviousTripShapeId : null
            });

            usedTripIds.Add(closestCirculation.TripId);
        }

        // Add scheduled-only circulations between now and the last realtime arrival
        if (scopeEnd > now)
        {
            var matchedTripIds = new HashSet<string>(usedTripIds);

            var scheduledWindow = timetable
                .Where(c => c.CallingDateTime(nowLocal.Date)!.Value >= now && c.CallingDateTime(nowLocal.Date)!.Value <= scopeEnd)
                .OrderBy(c => c.CallingDateTime(nowLocal.Date)!.Value);

            foreach (var sched in scheduledWindow)
            {
                if (matchedTripIds.Contains(sched.TripId))
                {
                    continue; // already represented via a matched realtime
                }

                var minutes = (int)(sched.CallingDateTime(nowLocal.Date)!.Value - now).TotalMinutes;
                if (minutes == 0)
                {
                    continue;
                }

                consolidatedCirculations.Add(new ConsolidatedCirculation
                {
                    Line = sched.Line,
                    Route = sched.Route,
                    Schedule = new ScheduleData
                    {
                        Running = sched.StartingDateTime(nowLocal.Date)!.Value <= now,
                        Minutes = minutes,
                        TripId = sched.TripId,
                        ServiceId = sched.ServiceId,
                        ShapeId = sched.ShapeId,
                    },
                    RealTime = null
                });
            }
        }

        // Sort by ETA (RealTime minutes if present; otherwise Schedule minutes)
        var sorted = consolidatedCirculations
            .OrderBy(c => c.RealTime?.Minutes ?? c.Schedule!.Minutes)
            .Select(LineFormatterService.Format)
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
    public static DateTime? StartingDateTime(this ScheduledArrival stop, DateTime baseDate)
    {
        return ParseGtfsTime(stop.StartingTime, baseDate);
    }

    public static DateTime? CallingDateTime(this ScheduledArrival stop, DateTime baseDate)
    {
        return ParseGtfsTime(stop.CallingTime, baseDate);
    }

    /// <summary>
    /// Parse GTFS time format (HH:MM:SS) which can have hours >= 24 for services past midnight
    /// </summary>
    private static DateTime? ParseGtfsTime(string timeStr, DateTime baseDate)
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
            var dt = baseDate
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
