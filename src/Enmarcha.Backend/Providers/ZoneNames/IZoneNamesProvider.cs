using Enmarcha.Backend.Dto;

namespace Enmarcha.Backend.Providers.ZoneNames;

public interface IZoneNamesProvider
{
    List<string> GetPreviousZones(StopEstimate estimate);
    List<string> GetNextZones(StopEstimate estimate);
}
