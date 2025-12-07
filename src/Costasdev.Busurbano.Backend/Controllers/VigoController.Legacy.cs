using System.Globalization;
using System.Text.Json;
using Costasdev.Busurbano.Backend.Types;
using Microsoft.AspNetCore.Mvc;
using SysFile = System.IO.File;

namespace Costasdev.Busurbano.Backend.Controllers;

public partial class VigoController : ControllerBase
{
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
            var file = Path.Combine(_configuration.VitrasaScheduleBasePath, effectiveDate, stopId + ".json");
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

}
