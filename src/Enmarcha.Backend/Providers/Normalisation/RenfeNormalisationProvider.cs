using Enmarcha.Backend.Dto;

namespace Enmarcha.Backend.Providers.Normalisation;

public class RenfeNormalisationProvider : INormalisationProvider
{
    public StopEstimate NormaliseArrival(StopEstimate estimate)
    {
        estimate.Circulation?.TripName = estimate.TripId.Split(":", 2)[1][..5];

        return estimate;
    }
}
