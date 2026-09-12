using Enmarcha.Backend.Configuration;
using Enmarcha.Backend.Types.Maptiler;
using Enmarcha.Backend.Types.Planner;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace Enmarcha.Backend.Services.Geocoding;

public class MaptilerGeocodingService : IGeocodingService
{
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;
    private readonly ILogger<MaptilerGeocodingService> _logger;
    private readonly AppConfiguration _config;

    private static readonly string[] ForbiddenResultTypes = ["city", "state", "county", "postcode"];

    public MaptilerGeocodingService(HttpClient httpClient, IMemoryCache cache, ILogger<MaptilerGeocodingService> logger, IOptions<AppConfiguration> config)
    {
        _httpClient = httpClient;
        _cache = cache;
        _logger = logger;
        _config = config.Value;

        // Maptiler requires a User-Agent
        if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
        {
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Compatible; EnMarcha; https://enmarcha.app; contacto@enmarcha.app)");
        }
    }

    public async Task<List<PlannerSearchResult>> GetAutocompleteAsync(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return [];
        }

        var cacheKey = $"maptiler_autocomplete_{query.ToLowerInvariant()}";
        var cacheHit = _cache.TryGetValue(cacheKey, out List<PlannerSearchResult>? cachedResults);

        if (cacheHit && cachedResults != null)
        {
            return cachedResults;
        }

        var url = $"https://api.maptiler.com/geocoding/{Uri.EscapeDataString(query)}.json?language=es&limit=5&bbox=-9.5,41.9,-6,44&autocomplete=false&fuzzyMatch=true&types=joint_municipality,joint_submunicipality,municipality,locality,neighbourhood,place,address,road";

        try
        {
            var httpResponse = await _httpClient.GetAsync(url + $"&key={_config.MaptilerApiKey}");
            if (!httpResponse.IsSuccessStatusCode)
            {
                var body = await httpResponse.Content.ReadAsStringAsync();
                _logger.LogWarning("Maptiler autocomplete returned {StatusCode} for query '{Query}': {Body}",
                    (int)httpResponse.StatusCode, query, body);
                return [];
            }

            var response = await httpResponse.Content.ReadFromJsonAsync<MaptilerResult>();
            var results = response?.Features
                .Select(MapToPlannerSearchResult)
                .ToList() ?? [];

            _cache.Set(cacheKey, results, TimeSpan.FromMinutes(60));
            return results;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching Maptiler autocomplete results from {Url}", url);
            return [];
        }
    }

    public async Task<PlannerSearchResult?> GetReverseGeocodeAsync(double lat, double lon)
    {
        var cacheKey = $"nominatim_reverse_{lat:F6}_{lon:F6}";
        var cacheHit = _cache.TryGetValue(cacheKey, out PlannerSearchResult? cachedResult);

        if (cacheHit && cachedResult != null)
        {
            return cachedResult;
        }

        var url =
            $"https://api.maptiler.com/geocoding/{lon:F6},{lat:F6}.json?language=es&limit=1&types=address";
        try
        {
            var httpResponse = await _httpClient.GetAsync(url + $"&key={_config.MaptilerApiKey}");
            if (!httpResponse.IsSuccessStatusCode)
            {
                var body = await httpResponse.Content.ReadAsStringAsync();
                _logger.LogWarning("Maptiler reverse geocode returned {StatusCode} for ({Lat},{Lon}): {Body}",
                    (int)httpResponse.StatusCode, lat, lon, body);
                return null;
            }

            var response = await httpResponse.Content.ReadFromJsonAsync<MaptilerResult>();
            if (response == null)
            {
                return null;
            }

            var result = MapToPlannerSearchResult(response.Features[0]);

            _cache.Set(cacheKey, result, TimeSpan.FromMinutes(60));
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching Maptiler reverse geocode results from {Url}", url);
            return null;
        }
    }

    private PlannerSearchResult MapToPlannerSearchResult(Feature feature)
    {
        return new PlannerSearchResult
        {
            Name = feature.TextEs,
            Label = feature.PlaceNameEs,
            Lat = feature.Center[1],
            Lon = feature.Center[0],
            Layer = feature.PlaceType[0]
        };
    }
}
