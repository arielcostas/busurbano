using Enmarcha.Backend.Dto;

namespace Enmarcha.Backend.Providers.Normalisation;

public class CorunaNormalisationProvider : INormalisationProvider
{
    public StopEstimate NormaliseArrival(StopEstimate estimate)
    {
        estimate.Circulation = GetTranviasCirculation(estimate.TripId, estimate.Circulation);

        return estimate;
    }

    private static EstimateCirculation GetTranviasCirculation(string tripId, EstimateCirculation? circulation)
    {
        // Example:  200032223 || 2301032230
        var padded = tripId.PadLeft(10);

        var dayOfWeek = padded[4..6] switch
        {
            "01" => "Lab",
            "02" => "Sab",
            "03" => "Dom",
            "04" => "Fes",
            "05" or "06" or "07" => "NoLec",
            "08" => "Ex.UDC",
            "09" => "Desc",
            "10" => "Navid",
            _ => ""
        };

        circulation ??= new EstimateCirculation
        {
            DepartureTime = $"{padded[6..8]}:{padded[8..]}"
        };
        circulation.ShiftName = padded[..4].Trim();
        circulation.TripName = $"{dayOfWeek} {padded[6..]}";
        return circulation;
    }
}
