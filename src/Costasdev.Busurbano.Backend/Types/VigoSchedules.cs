using System.Text.Json.Serialization;

namespace Costasdev.Busurbano.Backend.Types;

public class ScheduledStop
{
    [JsonPropertyName("trip_id")] public required string TripId { get; set; }
    [JsonPropertyName("service_id")] public required string ServiceId { get; set; }
    [JsonPropertyName("line")] public required string Line { get; set; }
    [JsonPropertyName("route")] public required string Route { get; set; }
    [JsonPropertyName("stop_sequence")] public required int StopSequence { get; set; }

    [JsonPropertyName("shape_dist_traveled")]
    public required double ShapeDistTraveled { get; set; }

    [JsonPropertyName("next_streets")] public required string[] NextStreets { get; set; }
    [JsonPropertyName("starting_code")] public required string StartingCode { get; set; }
    [JsonPropertyName("starting_name")] public required string StartingName { get; set; }
    [JsonPropertyName("starting_time")] public required string StartingTime { get; set; }
    [JsonPropertyName("calling_time")] public required string CallingTime { get; set; }
    public DateTime CallingDateTime()
    {
        var dt = DateTime.Today + TimeOnly.Parse(CallingTime).ToTimeSpan();
        return dt.AddSeconds(60 - dt.Second);
    }

    [JsonPropertyName("calling_ssm")] public required int CallingSsm { get; set; }
    [JsonPropertyName("terminus_code")] public required string TerminusCode { get; set; }
    [JsonPropertyName("terminus_name")] public required string TerminusName { get; set; }
    [JsonPropertyName("terminus_time")] public required string TerminusTime { get; set; }
}
