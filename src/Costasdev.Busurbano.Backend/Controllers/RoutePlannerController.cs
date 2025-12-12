using Costasdev.Busurbano.Backend.Services;
using Costasdev.Busurbano.Backend.Types.Planner;
using Microsoft.AspNetCore.Mvc;

namespace Costasdev.Busurbano.Backend.Controllers;

[ApiController]
[Route("api/planner")]
public class RoutePlannerController : ControllerBase
{
    private readonly OtpService _otpService;

    public RoutePlannerController(OtpService otpService)
    {
        _otpService = otpService;
    }

    [HttpGet("autocomplete")]
    public async Task<ActionResult<List<PlannerSearchResult>>> Autocomplete([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest("Query cannot be empty");
        }

        var results = await _otpService.GetAutocompleteAsync(query);
        return Ok(results);
    }

    [HttpGet("reverse")]
    public async Task<ActionResult<PlannerSearchResult>> Reverse([FromQuery] double lat, [FromQuery] double lon)
    {
        var result = await _otpService.GetReverseGeocodeAsync(lat, lon);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpGet("plan")]
    public async Task<ActionResult<RoutePlan>> Plan(
        [FromQuery] double fromLat,
        [FromQuery] double fromLon,
        [FromQuery] double toLat,
        [FromQuery] double toLon,
        [FromQuery] DateTime? time = null,
        [FromQuery] bool arriveBy = false)
    {
        try
        {
            var plan = await _otpService.GetRoutePlanAsync(fromLat, fromLon, toLat, toLon, time, arriveBy);
            return Ok(plan);
        }
        catch (Exception)
        {
            // Log error
            return StatusCode(500, "An error occurred while planning the route.");
        }
    }
}
