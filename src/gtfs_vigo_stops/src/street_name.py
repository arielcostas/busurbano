import re


re_remove_quotation_marks = re.compile(r'[""”]', re.IGNORECASE)
re_anything_before_stopcharacters_with_parentheses = re.compile(
    r'^(.*?)(?:,|\s\s|\s-\s| \d| S\/N|\s\()', re.IGNORECASE)
re_remove_street_type = re.compile(
    r'^(?:Rúa|Avda\.?|Avenida|Camiño|Estrada)(?:\s+d[aeo]s?)?\s*', re.IGNORECASE)

exception_streets = [
    "Avda. do Aeroporto",
    "Avda. de Samil",
    "Avda. de Castrelos",
    "Estrada da Garrida",
    "Estrada de Valadares",
    "Estrada do Monte Alba",
    "Estrada da Gándara",
    "Estrada do Vao",
    "Avda. do Tranvía",
    "Avda. da Atlántida",
    "Avda. da Ponte",
    "Rúa da Cruz",
    "Estrada das Prantas"
]


def get_street_name(original_name: str) -> str:
    original_name = re.sub(re_remove_quotation_marks,
                           '', original_name).strip()
    match = re.match(
        re_anything_before_stopcharacters_with_parentheses, original_name)
    if match:
        street_name = match.group(1)
    else:
        street_name = original_name

    if street_name in exception_streets:
        return street_name

    street_name = re.sub(re_remove_street_type, '', street_name).strip()
    return street_name


def normalise_stop_name(original_name: str|None) -> str:
    if original_name is None:
        return ''
    stop_name = re.sub(re_remove_quotation_marks, '', original_name).strip()

    stop_name = stop_name.replace('  ', ', ')

    return stop_name
