using Costasdev.Busurbano.Backend.Types;

namespace Costasdev.Busurbano.Backend.Services;

public class LineFormatterService
{
    public static ConsolidatedCirculation Format(ConsolidatedCirculation circulation)
    {
        circulation.Route = circulation.Route.Replace("*", "");

        if (circulation.Route == "FORA DE SERVIZO.G.B.")
        {
            circulation.Route = "García Barbón, 7 (fora de servizo)";
        }

        if (circulation.Line == "18A")
        {
            circulation.Route = circulation.Route
                .Replace("\"A\" ", "")
                .Trim()
                .Replace("SARDOMA por MANTELAS", "Praza de Miraflores");
            return circulation;
        }

        if (circulation.Line == "5A")
        {
            circulation.Route = circulation.Route
                .Replace("Rúa da Travesía de Vigo, 220", "URZAIZ - TVA DE VIGO");
            return circulation;
        }

        if (circulation.Line == "5B")
        {
            circulation.Route = circulation.Route
                .Replace("Rúa de Sanjurjo Badía, 252", "S. BADIA - TVA DE VIGO");
            return circulation;
        }

        if (circulation.Line == "11")
        {
            circulation.Route = circulation.Route
                .Replace("Avda. de Cesáreo Vázquez, 61", "SAN MIGUEL por FLORIDA");
            return circulation;
        }

        if (circulation.Line == "4C")
        {
            circulation.Route = circulation.Route
                .Replace("Rúa do Porriño (fronte 9)", "COIA POR CASTELAO");
            return circulation;
        }

        if (circulation.Line == "6")
        {
            circulation.Route = circulation.Route
                .Replace("\"", "");
            return circulation;
        }

        if (circulation.Line == "FUT")
        {
            if (circulation.Route == "CASTELAO-CAMELIAS-G.BARBÓN.M.GARRIDO")
            {
                circulation.Line = "MAR";
                circulation.Route = "MARCADOR ⚽: CASTELAO-CAMELIAS-G.BARBÓN.M.GARRIDO";
            }

            if (circulation.Route == "P. ESPAÑA-T.VIGO-S.BADÍA")
            {
                circulation.Line = "RIO";
                circulation.Route = "RÍO ⚽: P. ESPAÑA-T.VIGO-S.BADÍA";
            }

            if (circulation.Route == "NAVIA-BOUZAS-URZAIZ-G. ESPINO")
            {
                circulation.Line = "GOL";
                circulation.Route = "GOL ⚽: NAVIA-BOUZAS-URZAIZ-G. ESPINO";
            }

            return circulation;
        }

        return circulation;
    }
}
