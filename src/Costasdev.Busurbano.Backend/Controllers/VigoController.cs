using Costasdev.Busurbano.Backend.Configuration;
using Costasdev.Busurbano.Backend.Services;
using Costasdev.Busurbano.Backend.Services.Providers;
using Costasdev.VigoTransitApi;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Costasdev.Busurbano.Backend.Controllers;

[ApiController]
[Route("api/vigo")]
public partial class VigoController : ControllerBase
{
    private readonly ILogger<VigoController> _logger;
    private readonly VigoTransitApiClient _api;
    private readonly AppConfiguration _configuration;
    private readonly ShapeTraversalService _shapeService;
    private readonly VitrasaTransitProvider _vitrasaProvider;
    private readonly RenfeTransitProvider _renfeProvider;

    public VigoController(
        HttpClient http,
        IOptions<AppConfiguration> options,
        ILogger<VigoController> logger,
        ShapeTraversalService shapeService,
        VitrasaTransitProvider vitrasaProvider,
        RenfeTransitProvider renfeProvider)
    {
        _logger = logger;
        _api = new VigoTransitApiClient(http);
        _configuration = options.Value;
        _shapeService = shapeService;
        _vitrasaProvider = vitrasaProvider;
        _renfeProvider = renfeProvider;
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
        [FromQuery] string stopId
    )
    {
        // Use Europe/Madrid timezone consistently to avoid UTC/local skew
        var tz = TimeZoneInfo.FindSystemTimeZoneById("Europe/Madrid");
        var nowLocal = TimeZoneInfo.ConvertTime(DateTime.UtcNow, tz);

        ITransitProvider provider;
        string effectiveStopId;

        if (stopId.StartsWith("renfe:"))
        {
            provider = _renfeProvider;
            effectiveStopId = stopId.Substring("renfe:".Length);
        }
        else if (stopId.StartsWith("vitrasa:"))
        {
            provider = _vitrasaProvider;
            effectiveStopId = stopId.Substring("vitrasa:".Length);
        }
        else
        {
            // Legacy/Default
            provider = _vitrasaProvider;
            effectiveStopId = stopId;
        }

        var result = await provider.GetCirculationsAsync(effectiveStopId, nowLocal);
        return Ok(result);
    }
}
