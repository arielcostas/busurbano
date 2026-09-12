using System.Text.RegularExpressions;
using Enmarcha.Backend.Dto;
using Enmarcha.Backend.Types.Arrivals;

namespace Enmarcha.Backend.Providers.Normalisation;

public partial class XuntaNormalisationProvider : INormalisationProvider
{
    public StopEstimate NormaliseArrival(StopEstimate estimate)
    {
        estimate.Route.ShortName = GetShortName(estimate.Route.ShortName);

        return estimate;
    }

    private static string GetShortName(string shortName)
    {
        if (!shortName.StartsWith("XG"))
        {
            return shortName;
        }

        var match = XuntaRouteRegex.Match(shortName);
        if (!match.Success)
        {
            return shortName;
        }

        // XG817014 -> 817.14
        var contract = match.Groups["contract"].Value;
        var lineStr = match.Groups["line"].Value;
        return int.TryParse(lineStr, out var line) ? $"{contract}.{line:D2}" : shortName;
    }

    [GeneratedRegex(@"^XG(?<contract>\d{3})(?<line>\d{3})")]
    private static partial Regex XuntaRouteRegex { get; }
}
