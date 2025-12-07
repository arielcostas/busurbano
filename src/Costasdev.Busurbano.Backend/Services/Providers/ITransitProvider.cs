using Costasdev.Busurbano.Backend.Types;

namespace Costasdev.Busurbano.Backend.Services.Providers;

public interface ITransitProvider
{
    Task<List<ConsolidatedCirculation>> GetCirculationsAsync(string stopId, DateTime now);
}
