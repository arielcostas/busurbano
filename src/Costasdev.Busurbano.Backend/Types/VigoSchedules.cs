using System.Text.Json.Serialization;

namespace Costasdev.Busurbano.Backend.Types;

public class ScheduledStop
{
    [JsonPropertyName("line")] public required Line Line { get; set; }
    [JsonPropertyName("trip")] public required Trip Trip { get; set; }
    [JsonPropertyName("route_id")] public required string RouteId { get; set; }
    [JsonPropertyName("departure_time")] public required string DepartureTime { get; set; }

    public DateTime DepartureDateTime()
    {
        var dt = DateTime.Today + TimeOnly.Parse(DepartureTime).ToTimeSpan();
        return dt.AddSeconds(60 - dt.Second);
    }

    [JsonPropertyName("stop_sequence")] public required int StopSequence { get; set; }

    [JsonPropertyName("shape_dist_traveled")]
    public required float ShapeDistTraveled { get; set; }

    [JsonPropertyName("next_streets")] public required string[] NextStreets { get; set; }
}

public class Line
{
    [JsonPropertyName("name")] public required string Name { get; set; }
    [JsonPropertyName("colour")] public required string Colour { get; set; }
}

public class Trip
{
    [JsonPropertyName("id")] public required string Id { get; set; }
    [JsonPropertyName("service_id")] public required string ServiceId { get; set; }
    [JsonPropertyName("headsign")] public required string Headsign { get; set; }
    [JsonPropertyName("direction_id")] public required int DirectionId { get; set; }
}
