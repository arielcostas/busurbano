using System.Text.Json.Serialization;

namespace Enmarcha.Backend.Types.Maptiler;

#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.

public class MaptilerResult
{
    public string Type { get; set; }
    public Feature[] Features { get; set; }
    public string[] Query { get; set; }
    public string Attribution { get; set; }
}

public class Feature
{
    [JsonPropertyName("type")] public string Type { get; set; }
    [JsonPropertyName("properties")] public Properties Properties { get; set; }
    [JsonPropertyName("geometry")] public Geometry Geometry { get; set; }
    [JsonPropertyName("bbox")] public double[] Bbox { get; set; }
    [JsonPropertyName("center")] public double[] Center { get; set; }
    [JsonPropertyName("place_name")] public string PlaceName { get; set; }
    [JsonPropertyName("place_type")] public string[] PlaceType { get; set; }
    [JsonPropertyName("relevance")] public double Relevance { get; set; }
    [JsonPropertyName("id")] public string Id { get; set; }
    [JsonPropertyName("text")] public string Text { get; set; }
    [JsonPropertyName("place_type_name")] public string[] PlaceTypeName { get; set; }
    [JsonPropertyName("context")] public Context[] Context { get; set; }
    [JsonPropertyName("address")] public string Address { get; set; }
    [JsonPropertyName("text_es")] public string TextEs { get; set; }
    [JsonPropertyName("place_name_es")] public string PlaceNameEs { get; set; }
}

public class Properties
{
    [JsonPropertyName("ref")] public string Reference { get; set; }
    [JsonPropertyName("country_code")] public string CountryCode { get; set; }
    [JsonPropertyName("kind")] public string Kind { get; set; }
    [JsonPropertyName("place_type_name")] public string[] PlaceTypeName { get; set; }
}

public class Geometry
{
    public string type { get; set; }
    public double[] coordinates { get; set; }
}

public class Context
{
    public string Ref { get; set; }
    public string id { get; set; }
    public string text { get; set; }
    public string country_code { get; set; }
    public string text_es { get; set; }
    public string kind { get; set; }
    public string place_designation { get; set; }
    public string wikidata { get; set; }
    public string language { get; set; }
    public string language_es { get; set; }
    public Feature_tags feature_tags { get; set; }
    public string[] categories { get; set; }
}

public class Feature_tags
{
    public string boundary { get; set; }
    public string natural { get; set; }
    public string wikipedia { get; set; }
    public string type { get; set; }
    public string sinkhole { get; set; }
    public string sqkm { get; set; }
    public string place { get; set; }
    public string population { get; set; }
}
