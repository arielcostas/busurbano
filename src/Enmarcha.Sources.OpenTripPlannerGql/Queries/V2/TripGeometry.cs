using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Enmarcha.Sources.OpenTripPlannerGql.Queries.V2;

public class TripsGeometryContent : IGraphRequest<TripsGeometryContent.Args>
{
    public record Args(List<string> TripIds);

    public static string Query(Args args)
    {
        StringBuilder sb = new("query Query {");

        for(int i = 0; i < args.TripIds.Count(); i++)
        {
            var tid = args.TripIds[i];
            sb.Append($@"
                    trip_{i}: trip(id: ""{tid}"") {{
                        tripGeometry {{
                            points
                        }}
                        stoptimes {{
                            stop {{
                                name
                                lat
                                lon
                            }}
                        }}
                    }}
                ");
        }

        sb.Append('}');

        return sb.ToString();
    }
}

public class TripsGeometryResponse : AbstractGraphResponse
{
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? DynamicTrips { get; set; }

    public class TripDetails
    {
        [JsonPropertyName("tripGeometry")] public GeometryDetails? Geometry { get; set; }

        [JsonPropertyName("stoptimes")] public List<StoptimeDetails> Stoptimes { get; set; } = [];
    }

    public class GeometryDetails
    {
        [JsonPropertyName("points")] public string? Points { get; set; }
    }

    public class StoptimeDetails
    {
        [JsonPropertyName("stop")] public required StopDetails Stop { get; set; }
    }

    public class StopDetails
    {
        [JsonPropertyName("name")] public required string Name { get; set; }
        [JsonPropertyName("lat")] public double Lat { get; set; }
        [JsonPropertyName("lon")] public double Lon { get; set; }
    }
}
