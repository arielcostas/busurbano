using Enmarcha.Backend.Dto;

namespace Enmarcha.Backend.Providers.ZoneNames;

public class XuntaZoneNamesProvider : IZoneNamesProvider
{
    public List<string> GetPreviousZones(StopEstimate estimate)
    {
        if (estimate.RealTimeOnly)
        {
            return [];
        }

        var currentStopDeparture = estimate.RawOtpArrival!.ScheduledAt;

        var previousStops = estimate.RawOtpArrival.Trip.Stoptimes
            .Where(s => s.ScheduledAt < currentStopDeparture)
            .OrderBy(s => s.ScheduledAt)
            .Select(s => $"{s.Stop.Name} -- {s.Stop.Description}")
            .Distinct()
            .ToList();

        return GetZoneNamesForStops(previousStops);
    }

    public List<string> GetNextZones(StopEstimate estimate)
    {
        if (estimate.RealTimeOnly)
        {
            return [];
        }

        var currentStopDeparture = estimate.RawOtpArrival!.ScheduledAt;

        var nextStops = estimate.RawOtpArrival.Trip.Stoptimes
            .Where(s => s.ScheduledAt > currentStopDeparture)
            .OrderBy(s => s.ScheduledAt)
            .Select(s => $"{s.Stop.Name} -- {s.Stop.Description}")
            .Distinct()
            .ToList();

        nextStops = nextStops.Take(nextStops.Count - 1).ToList();

        return GetZoneNamesForStops(nextStops);
    }

    private static List<string> GetZoneNamesForStops(List<string> nextStops)
    {
        var points = nextStops
            .Select(SplitXuntaStopDescription)
            .ToList();

        List<string> seenConcellos = [];
        List<string> seenParroquias = [];
        List<string> items = [];

        var maxPointsPerCouncil = points.GroupBy(p => p.concello)
            .Select(g => g.Count())
            .DefaultIfEmpty(0)
            .Max();

        if (maxPointsPerCouncil == 1)
        {
            // If there's only one stop per council, we can simplify the marquee to just show the council names
            return points.Select(p => p.nombre).Distinct().ToList();
        }

        foreach (var (nombre, parroquia, concello) in points)
        {
            // Santiago de Compostela -- Santiago de Compostela > Conxo -- Santiago de Compostela > Biduído -- Ames > Calo -- Teo > Bugallido -- Ames
            // Santiago de Compostela -> Conxo -> Bidueiro (Ames) -> Calo (Teo) -> Bugallido
            string item = "";

            if (!seenParroquias.Contains(parroquia))
            {
                seenParroquias.Add(parroquia);
                item += $"{parroquia}";

                if (parroquia == concello)
                {
                    seenConcellos.Add(concello);
                }

                if (!seenConcellos.Contains(concello))
                {
                    seenConcellos.Add(concello);
                    item = $"{item} ({concello})";
                }

                items.Add(item);
            }

        }

        return items;
    }

    private static (string nombre, string parroquia, string concello) SplitXuntaStopDescription(string stopName)
    {
        var parts = stopName.Split(" -- ", 3);
        if (parts.Length != 3)
        {
            return ("", "", ""); // TODO: Throw
        }

        return (parts[0], parts[1], parts[2]);
    }
}
