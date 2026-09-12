using System.Text.RegularExpressions;

namespace Enmarcha.Backend.Helpers;

public class StreetNameUtil
{
    public static string GetStreet(string originalName)
    {
        var name = RemoveQuotationMarks.Replace(originalName, "").Trim();
        var match = StreetNameRegex.Match(name);
        var streetName = match.Success ? match.Groups[1].Value : name;

        foreach (var replacement in NameReplacements)
        {
            if (streetName.Contains(replacement.Key, StringComparison.OrdinalIgnoreCase))
            {
                streetName = streetName.Replace(replacement.Key, replacement.Value, StringComparison.OrdinalIgnoreCase);
                return streetName.Trim();
            }
        }

        return streetName.Trim();
    }

    private static readonly Regex RemoveQuotationMarks = new(@"[""”]", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex StreetNameRegex = new(@"^(.*?)(?:,|\s\s|\s-\s| \d| S\/N|\s\()",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Dictionary<string, string> NameReplacements = new(StringComparer.OrdinalIgnoreCase)
    {
        { "Rúa da Salguera Entrada", "Rúa da Salgueira" },
        { "Rúa da Salgueira Entrada", "Rúa da Salgueira" },
        { "Estrada de Miraflores", "Estrada Miraflores" },
        { "Avda. de Europa", "Avda. Europa" },
        { "Avda. de Galicia", "Avda. Galicia" },
        { "Avda. de Vigo", "Avda. Vigo" },
        { "Avda. da Ponte", "Avda. Ponte" },
        { "Avda. de Madrid", "Avda. Madrid" },
        { "Avda. de García Barbón", "G. Barbón" },
        { "Avda. García Barbón", "G. Barbón" },
        { "FORA DE SERVIZO.G.B.", "" },
        { "Praza de Fernando O Católico", "" },
        { "Rúa da Travesía de Vigo", "Travesía de Vigo" },
        { "Rúa de ", " " },
        { "Rúa do ", " " },
        { "Rúa da ", " " },
        { "Rúa dos ", " " },
        { "Rúa das ", " " },
        { "Avda. de ", " " },
        { "Avda. do ", " " },
        { "Avda. das ", " " },
        { "Camiño da ", " " },
        { "Camiño do ", " " },
        { "Riós", "Ríos" },
        { "Avda. Beiramar Porto Pesqueiro Berbés", "Berbés" },
        { "Conde de Torrecedeira", "Torrecedeira" },
    };
}
