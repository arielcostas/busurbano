using System.Globalization;
using System.Text;
using Costasdev.Busurbano.Backend.Configuration;
using Costasdev.Busurbano.Backend.Types.Otp;
using Costasdev.Busurbano.Backend.Types.Planner;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace Costasdev.Busurbano.Backend.Services;

public class OtpService
{
    private readonly HttpClient _httpClient;
    private readonly AppConfiguration _config;
    private readonly IMemoryCache _cache;
    private readonly ILogger<OtpService> _logger;

    public OtpService(HttpClient httpClient, IOptions<AppConfiguration> config, IMemoryCache cache, ILogger<OtpService> logger)
    {
        _httpClient = httpClient;
        _config = config.Value;
        _cache = cache;
        _logger = logger;
    }

    public async Task<List<PlannerSearchResult>> GetAutocompleteAsync(string query)
    {
        if (string.IsNullOrWhiteSpace(query)) return new List<PlannerSearchResult>();

        var cacheKey = $"otp_autocomplete_{query.ToLowerInvariant()}";
        if (_cache.TryGetValue(cacheKey, out List<PlannerSearchResult>? cachedResults) && cachedResults != null)
        {
            return cachedResults;
        }

        try
        {
            // https://planificador-rutas-api.vigo.org/v1/autocomplete?text=XXXX&layers=venue,street,address&lang=es
            var url = $"{_config.OtpGeocodingBaseUrl}/autocomplete?text={Uri.EscapeDataString(query)}&layers=venue,address&lang=es";
            var response = await _httpClient.GetFromJsonAsync<OtpGeocodeResponse>(url);

            var results = response?.Features.Select(f => new PlannerSearchResult
            {
                Name = f.Properties?.Name,
                Label = $"{f.Properties?.PostalCode} ${f.Properties?.LocalAdmin}, {f.Properties?.Region}",
                Layer = f.Properties?.Layer,
                Lat = f.Geometry?.Coordinates.Count > 1 ? f.Geometry.Coordinates[1] : 0,
                Lon = f.Geometry?.Coordinates.Count > 0 ? f.Geometry.Coordinates[0] : 0
            }).ToList() ?? new List<PlannerSearchResult>();

            _cache.Set(cacheKey, results, TimeSpan.FromMinutes(30)); // Cache for 30 mins
            return results;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching autocomplete results");
            return new List<PlannerSearchResult>();
        }
    }

    public async Task<PlannerSearchResult?> GetReverseGeocodeAsync(double lat, double lon)
    {
        var cacheKey = $"otp_reverse_{lat:F5}_{lon:F5}";
        if (_cache.TryGetValue(cacheKey, out PlannerSearchResult? cachedResult) && cachedResult != null)
        {
            return cachedResult;
        }

        try
        {
            // https://planificador-rutas-api.vigo.org/v1/reverse?point.lat=LAT&point.lon=LON&lang=es
            var url = $"{_config.OtpGeocodingBaseUrl}/reverse?point.lat={lat.ToString(CultureInfo.InvariantCulture)}&point.lon={lon.ToString(CultureInfo.InvariantCulture)}&lang=es";
            var response = await _httpClient.GetFromJsonAsync<OtpGeocodeResponse>(url);

            var feature = response?.Features.FirstOrDefault();
            if (feature == null) return null;

            var result = new PlannerSearchResult
            {
                Name = feature.Properties?.Name,
                Label = feature.Properties?.Label,
                Layer = feature.Properties?.Layer,
                Lat = feature.Geometry?.Coordinates.Count > 1 ? feature.Geometry.Coordinates[1] : 0,
                Lon = feature.Geometry?.Coordinates.Count > 0 ? feature.Geometry.Coordinates[0] : 0
            };

            _cache.Set(cacheKey, result, TimeSpan.FromMinutes(60)); // Cache for 1 hour
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching reverse geocode results");
            return null;
        }
    }

    public async Task<RoutePlan> GetRoutePlanAsync(double fromLat, double fromLon, double toLat, double toLon, DateTime? time = null, bool arriveBy = false)
    {
        try
        {
            // Convert the provided time to Europe/Madrid local time and pass explicit offset to OTP
            var tz = TimeZoneInfo.FindSystemTimeZoneById("Europe/Madrid");
            DateTime utcReference;
            if (time.HasValue)
            {
                var t = time.Value;
                if (t.Kind == DateTimeKind.Unspecified)
                    t = DateTime.SpecifyKind(t, DateTimeKind.Utc);
                utcReference = t.Kind == DateTimeKind.Utc ? t : t.ToUniversalTime();
            }
            else
            {
                utcReference = DateTime.UtcNow;
            }

            var localMadrid = TimeZoneInfo.ConvertTimeFromUtc(utcReference, tz);
            var offsetSeconds = (int)tz.GetUtcOffset(localMadrid).TotalSeconds;

            var dateStr = localMadrid.ToString("MM/dd/yyyy", CultureInfo.InvariantCulture);
            var timeStr = localMadrid.ToString("HH:mm", CultureInfo.InvariantCulture);

            var queryParams = new Dictionary<string, string>
            {
                { "fromPlace", $"{fromLat.ToString(CultureInfo.InvariantCulture)},{fromLon.ToString(CultureInfo.InvariantCulture)}" },
                { "toPlace", $"{toLat.ToString(CultureInfo.InvariantCulture)},{toLon.ToString(CultureInfo.InvariantCulture)}" },
                { "arriveBy", arriveBy.ToString().ToLower() },
                { "date", dateStr },
                { "time", timeStr },
                { "locale", "es" },
                { "showIntermediateStops", "true" },
                { "mode", "TRANSIT,WALK" },
                { "numItineraries", _config.NumItineraries.ToString() },
                { "walkSpeed", _config.WalkSpeed.ToString(CultureInfo.InvariantCulture) },
                { "maxWalkDistance", _config.MaxWalkDistance.ToString() }, // Note: OTP might ignore this if it's too small
                { "optimize", "QUICK" },
                { "wheelchair", "false" },
                { "timeZoneOffset", offsetSeconds.ToString(CultureInfo.InvariantCulture) }
            };

            // Add slack/comfort parameters
            queryParams["transferSlack"] = _config.TransferSlackSeconds.ToString();
            queryParams["minTransferTime"] = _config.MinTransferTimeSeconds.ToString();
            queryParams["walkReluctance"] = _config.WalkReluctance.ToString(CultureInfo.InvariantCulture);

            var queryString = string.Join("&", queryParams.Select(kvp => $"{kvp.Key}={Uri.EscapeDataString(kvp.Value)}"));
            var url = $"{_config.OtpPlannerBaseUrl}/plan?{queryString}";

            var response = await _httpClient.GetFromJsonAsync<OtpResponse>(url);

            if (response?.Plan == null)
            {
                return new RoutePlan();
            }

            return MapToRoutePlan(response.Plan);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching route plan");
            throw;
        }
    }

    private RoutePlan MapToRoutePlan(OtpPlan otpPlan)
    {
        // OTP times are already correct when requested with explicit offset
        var timeOffsetSeconds = 0L;

        return new RoutePlan
        {
            Itineraries = otpPlan.Itineraries.Select(MapItinerary).OrderBy(i => i.DurationSeconds).ToList(),
            TimeOffsetSeconds = timeOffsetSeconds
        };
    }

    private Itinerary MapItinerary(OtpItinerary otpItinerary)
    {
        var legs = otpItinerary.Legs.Select(MapLeg).ToList();
        var busLegs = legs.Where(leg => leg.Mode != null && leg.Mode.ToUpper() != "WALK");

        var cashFareEuro = busLegs.Count() * _config.FareCashPerBus;

        int cardTicketsRequired = 0;
        DateTime? lastTicketPurchased = null;
        int tripsPaidWithTicket = 0;

        foreach (var leg in busLegs)
        {
            // If no ticket purchased, ticket expired (no free transfers after 45 mins), or max trips with ticket reached
            if (
                lastTicketPurchased == null ||
                (leg.StartTime - lastTicketPurchased.Value).TotalMinutes > 45 ||
                tripsPaidWithTicket >= 3
            )
            {
                cardTicketsRequired++;
                lastTicketPurchased = leg.StartTime;
                tripsPaidWithTicket = 1;
            }
            else
            {
                tripsPaidWithTicket++;
            }
        }

        return new Itinerary
        {
            DurationSeconds = otpItinerary.Duration,
            StartTime = DateTimeOffset.FromUnixTimeMilliseconds(otpItinerary.StartTime).UtcDateTime,
            EndTime = DateTimeOffset.FromUnixTimeMilliseconds(otpItinerary.EndTime).UtcDateTime,
            WalkDistanceMeters = otpItinerary.WalkDistance,
            WalkTimeSeconds = otpItinerary.WalkTime,
            TransitTimeSeconds = otpItinerary.TransitTime,
            WaitingTimeSeconds = otpItinerary.WaitingTime,
            Legs = legs,
            CashFareEuro = cashFareEuro,
            CardFareEuro = cardTicketsRequired * _config.FareCardPerBus
        };
    }

    private Leg MapLeg(OtpLeg otpLeg)
    {
        return new Leg
        {
            Mode = otpLeg.Mode,
            RouteName = otpLeg.Route,
            RouteShortName = otpLeg.RouteShortName,
            RouteLongName = otpLeg.RouteLongName,
            Headsign = otpLeg.Headsign,
            AgencyName = otpLeg.AgencyName,
            RouteColor = otpLeg.RouteColor,
            RouteTextColor = otpLeg.RouteTextColor,
            From = MapPlace(otpLeg.From),
            To = MapPlace(otpLeg.To),
            StartTime = DateTimeOffset.FromUnixTimeMilliseconds(otpLeg.StartTime).UtcDateTime,
            EndTime = DateTimeOffset.FromUnixTimeMilliseconds(otpLeg.EndTime).UtcDateTime,
            DistanceMeters = otpLeg.Distance,
            Geometry = DecodePolyline(otpLeg.LegGeometry?.Points),
            Steps = otpLeg.Steps.Select(MapStep).ToList(),
            IntermediateStops = otpLeg.IntermediateStops.Select(MapPlace).Where(p => p != null).Cast<PlannerPlace>().ToList()
        };
    }

    private PlannerPlace? MapPlace(OtpPlace? otpPlace)
    {
        if (otpPlace == null) return null;
        return new PlannerPlace
        {
            Name = CorrectStopName(otpPlace.Name),
            Lat = otpPlace.Lat,
            Lon = otpPlace.Lon,
            StopId = otpPlace.StopId, // Use string directly
            StopCode = CorrectStopCode(otpPlace.StopCode)
        };
    }

    private string CorrectStopCode(string? stopId)
    {
        if (string.IsNullOrEmpty(stopId)) return stopId ?? string.Empty;

        var sb = new StringBuilder();
        foreach (var c in stopId)
        {
            if (char.IsNumber(c))
            {
                sb.Append(c);
            }
        }

        return int.Parse(sb.ToString()).ToString();
    }

    private string CorrectStopName(string? stopName)
    {
        if (string.IsNullOrEmpty(stopName)) return stopName ?? string.Empty;

        return stopName!.Replace("  ", ", ").Replace("\"", "");
    }

    private Step MapStep(OtpWalkStep otpStep)
    {
        return new Step
        {
            DistanceMeters = otpStep.Distance,
            RelativeDirection = otpStep.RelativeDirection,
            AbsoluteDirection = otpStep.AbsoluteDirection,
            StreetName = otpStep.StreetName,
            Lat = otpStep.Lat,
            Lon = otpStep.Lon
        };
    }

    private PlannerGeometry? DecodePolyline(string? encodedPoints)
    {
        if (string.IsNullOrEmpty(encodedPoints)) return null;

        var coordinates = Decode(encodedPoints);
        return new PlannerGeometry
        {
            Coordinates = coordinates.Select(c => new List<double> { c.Lon, c.Lat }).ToList()
        };
    }

    // Polyline decoding algorithm
    private static List<(double Lat, double Lon)> Decode(string encodedPoints)
    {
        if (string.IsNullOrEmpty(encodedPoints))
            return new List<(double, double)>();

        var poly = new List<(double, double)>();
        char[] polylineChars = encodedPoints.ToCharArray();
        int index = 0;

        int currentLat = 0;
        int currentLng = 0;
        int next5bits;
        int sum;
        int shifter;

        while (index < polylineChars.Length)
        {
            // calculate next latitude
            sum = 0;
            shifter = 0;
            do
            {
                next5bits = (int)polylineChars[index++] - 63;
                sum |= (next5bits & 31) << shifter;
                shifter += 5;
            } while (next5bits >= 32 && index < polylineChars.Length);

            if (index >= polylineChars.Length)
                break;

            currentLat += (sum & 1) == 1 ? ~(sum >> 1) : (sum >> 1);

            // calculate next longitude
            sum = 0;
            shifter = 0;
            do
            {
                next5bits = (int)polylineChars[index++] - 63;
                sum |= (next5bits & 31) << shifter;
                shifter += 5;
            } while (next5bits >= 32 && index < polylineChars.Length);

            currentLng += (sum & 1) == 1 ? ~(sum >> 1) : (sum >> 1);

            poly.Add((Convert.ToDouble(currentLat) / 100000.0, Convert.ToDouble(currentLng) / 100000.0));
        }

        return poly;
    }
}
