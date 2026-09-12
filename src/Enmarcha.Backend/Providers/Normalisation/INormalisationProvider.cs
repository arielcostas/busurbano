using Enmarcha.Backend.Dto;
using Enmarcha.Backend.Types.Arrivals;

namespace Enmarcha.Backend.Providers.Normalisation;

public interface INormalisationProvider
{
    StopEstimate NormaliseArrival(StopEstimate estimate);
}
