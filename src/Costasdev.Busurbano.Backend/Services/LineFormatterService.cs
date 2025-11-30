using Costasdev.Busurbano.Backend.Types;

namespace Costasdev.Busurbano.Backend.Services;

public class LineFormatterService
{
    public static ConsolidatedCirculation Format(ConsolidatedCirculation circulation)
    {
        circulation.Route = circulation.Route.Replace("*", "");

        if (circulation.Line == "18A")
        {
            circulation.Route = circulation.Route
                .Replace("\"A\" ", "")
                .Trim()
                .Replace("SARDOMA por MANTELAS", "Praza de Miraflores");
        }

        if (circulation.Line == "5A")
        {
            circulation.Route = circulation.Route
                .Replace("Rúa da Travesía de Vigo, 220", "URZAIZ - TVA DE VIGO");
        }

        if (circulation.Line == "5B")
        {
            circulation.Route = circulation.Route
                .Replace("Rúa de Sanjurjo Badía, 252", "S. BADIA - TVA DE VIGO");
        }

        if (circulation.Line == "11")
        {
            circulation.Route = circulation.Route
                .Replace("Avda. de Cesáreo Vázquez, 61", "SAN MIGUEL por FLORIDA");
        }

        if (circulation.Line == "4C")
        {
            circulation.Route = circulation.Route
                .Replace("Rúa do Porriño (fronte 9)", "COIA POR CASTELAO");
        }

        if (circulation.Line == "6")
        {
            circulation.Route = circulation.Route
                .Replace("\"", "");
        }

        return circulation;
    }
}
