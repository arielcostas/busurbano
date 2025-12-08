import re


re_remove_quotation_marks = re.compile(r'[""”]', re.IGNORECASE)
re_anything_before_stopcharacters_with_parentheses = re.compile(
    r"^(.*?)(?:,|\s\s|\s-\s| \d| S\/N|\s\()", re.IGNORECASE
)


NAME_REPLACEMENTS = {
    "Rúa da Salguera Entrada": "Rúa da Salgueira",
    "Rúa da Salgueira Entrada": "Rúa da Salgueira",
    "Estrada de Miraflores": "Estrada Miraflores",
    "FORA DE SERVIZO.G.B.": "",
    "Praza de Fernando O Católico": "",
    "Rúa da Travesía de Vigo": "Travesía de Vigo",
    " de ": " ",
    " do ": " ",
    " da ": " ",
    " das ": " ",
    "Riós": "Ríos",
}


def get_street_name(original_name: str) -> str:
    original_name = re.sub(re_remove_quotation_marks, "", original_name).strip()
    match = re.match(re_anything_before_stopcharacters_with_parentheses, original_name)
    if match:
        street_name = match.group(1)
    else:
        street_name = original_name

    for old_name, new_name in NAME_REPLACEMENTS.items():
        if old_name.lower() in street_name.lower():
            street_name = street_name.replace(old_name, new_name)
            return street_name.strip()

    return street_name


def normalise_stop_name(original_name: str | None) -> str:
    if original_name is None:
        return ""
    stop_name = re.sub(re_remove_quotation_marks, "", original_name).strip()

    stop_name = stop_name.replace("  ", ", ")

    return stop_name
