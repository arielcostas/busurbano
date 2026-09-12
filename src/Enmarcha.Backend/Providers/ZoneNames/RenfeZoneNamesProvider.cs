using Enmarcha.Backend.Dto;
using Enmarcha.Backend.Helpers;
using Enmarcha.Backend.Providers.Normalisation;

namespace Enmarcha.Backend.Providers.ZoneNames;

public class RenfeZoneNamesProvider : IZoneNamesProvider
{
    public List<string> GetPreviousZones(StopEstimate estimate)
    {
        if (estimate.RealTimeOnly)
        {
            return [];
        }

        var currentStopDeparture = estimate.RawOtpArrival!.ScheduledAt;

        var previousStops = estimate.RawOtpArrival!.Trip.Stoptimes
            .Where(s => s.ScheduledAt < currentStopDeparture)
            .OrderBy(s => s.ScheduledAt)
            .Select(s => s.Stop.Name)
            .ToList();

        return previousStops
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Distinct()
            .ToList();
    }

    public List<string> GetNextZones(StopEstimate estimate)
    {
        if (estimate.RealTimeOnly)
        {
            return [];
        }

        var currentStopDeparture = estimate.RawOtpArrival!.ScheduledAt;

        var nextStops = estimate.RawOtpArrival!.Trip.Stoptimes
            .Where(s => s.ScheduledAt > currentStopDeparture)
            .OrderBy(s => s.ScheduledAt)
            .Select(s => s.Stop.Name)
            .ToList();

        nextStops = nextStops.Take(nextStops.Count - 1).ToList();

        return nextStops
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Distinct()
            .ToList();
    }




}
