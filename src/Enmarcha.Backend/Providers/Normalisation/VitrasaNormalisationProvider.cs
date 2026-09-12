using Enmarcha.Backend.Dto;

namespace Enmarcha.Backend.Providers.Normalisation;

public class VitrasaNormalisationProvider : INormalisationProvider
{
    public StopEstimate NormaliseArrival(StopEstimate estimate)
    {
        estimate.Headsign.Destination = NormaliseStopName(estimate.Headsign.Destination);

        var destinationTrimmed = estimate.Headsign.Destination.Trim();

        switch (estimate.Route.ShortName)
        {
            case "A" when destinationTrimmed.StartsWith("\"1\"", StringComparison.Ordinal) ||
                          (destinationTrimmed is ['1', ..] &&
                           (destinationTrimmed.Length == 1 || !char.IsDigit(destinationTrimmed[1]))):
                estimate.Route.ShortName = "A1";
                // FixStopName() removes quotes, so handle both "\"1\"" and leading "1".
                destinationTrimmed =
                    destinationTrimmed.Substring(destinationTrimmed.StartsWith("\"1\"", StringComparison.Ordinal)
                        ? 3
                        : 1);

                estimate.Headsign.Destination = destinationTrimmed.TrimStart(' ', '-', '.', ':');
                break;
            case "6":
                estimate.Headsign.Destination = estimate.Headsign.Destination.Replace("\"", "");
                break;
            case "FUT":
                if (estimate.Headsign.Destination == "CASTELAO-CAMELIAS-G.BARBÓN.M.GARRIDO")
                {
                    estimate.Route.ShortName = "MAR";
                    estimate.Headsign.Destination = "MARCADOR ⚽: CASTELAO-CAMELIAS-G.BARBÓN.M.GARRIDO";
                }
                else if (estimate.Headsign.Destination == "P. ESPAÑA-T.VIGO-S.BADÍA")
                {
                    estimate.Route.ShortName = "RIO";
                    estimate.Headsign.Destination = "RÍO ⚽: P. ESPAÑA-T.VIGO-S.BADÍA";
                }
                else if (estimate.Headsign.Destination == "NAVIA-BOUZAS-URZAIZ-G. ESPINO")
                {
                    estimate.Route.ShortName = "GOL";
                    estimate.Headsign.Destination = "GOL ⚽: NAVIA-BOUZAS-URZAIZ-G. ESPINO";
                }

                estimate.Route.Colour = "6CACE4";
                estimate.Route.TextColour = "000000";
                break;
        }

        return estimate;
    }

    public static string NormaliseStopName(string name)
    {
        return name
            .Trim()
            .Replace("\"", "")
            .Replace("  ", ", ")
            .Replace("*", "")
            .Trim();
    }
}
