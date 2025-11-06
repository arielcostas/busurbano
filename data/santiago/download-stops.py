# /// script
# requires-python = ">=3.12"
# dependencies = [
#    "PyYAML>=6.0.2",  # For YAML support
# ]
# ///
import json
import os
import sys
import urllib.request
import yaml  # Add YAML support for overrides

OVERRIDES_DIR = "overrides"
OUTPUT_FILE = "../../src/frontend/public/stops/santiago.json"

def load_stop_overrides(file_path):
    """Load stop overrides from a YAML file"""
    if not os.path.exists(file_path):
        print(f"Warning: Overrides file {file_path} not found")
        return {}

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            overrides = yaml.safe_load(f)
            print(f"Loaded {len(overrides) if overrides else 0} stop overrides")
            return overrides or {}
    except Exception as e:
        print(f"Error loading overrides: {e}", file=sys.stderr)
        return {}

def apply_overrides(stops, overrides):
    """Apply overrides to the stop data"""
    for stop in stops:
        stop_id = stop.get("stopId")
        if stop_id in overrides:
            override = overrides[stop_id]

            # Override name if provided
            if "name" in override:
                stop["name"]["original"] = override["name"]

            # Apply or add alternate names
            if "alternateNames" in override:
                for key, value in override["alternateNames"].items():
                    stop["name"][key] = value

            # Apply location override
            if "location" in override:
                if "latitude" in override["location"]:
                    stop["latitude"] = override["location"]["latitude"]
                if "longitude" in override["location"]:
                    stop["longitude"] = override["location"]["longitude"]

            # Add amenities
            if "amenities" in override:
                stop["amenities"] = override["amenities"]

            # Mark stop as hidden if needed
            if "hide" in override:
                stop["hide"] = override["hide"]

            # Mark stop as cancelled
            if "cancelled" in override:
                stop["cancelled"] = override["cancelled"]

            # Add alert title
            if "title" in override:
                stop["title"] = override["title"]

            # Add alert message
            if "message" in override:
                stop["message"] = override["message"]

            # Add alternate codes
            if "alternateCodes" in override:
                stop["alternateCodes"] = override["alternateCodes"]

    return stops

def load_manual_stops(file_path):
    """Load manually defined stops from a YAML file"""
    if not os.path.exists(file_path):
        print(f"No manual stops file found at {file_path}")
        return []

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            manual_data = yaml.safe_load(f)
            if not manual_data:
                return []
            
            manual_stops = []
            for stop_id, stop_def in manual_data.items():
                # Ensure stop_id is an integer for consistency
                stop_id_int = int(stop_id) if isinstance(stop_id, str) else stop_id
                
                # Build the stop object from the manual definition
                stop = {
                    "stopId": stop_id_int,
                    "name": {
                        "original": stop_def.get("name", f"Stop {stop_id_int}")
                    },
                    "latitude": stop_def.get("location", {}).get("latitude"),
                    "longitude": stop_def.get("location", {}).get("longitude"),
                    "lines": stop_def.get("lines", [])
                }
                
                # Add optional fields
                if "amenities" in stop_def:
                    stop["amenities"] = stop_def["amenities"]
                if "cancelled" in stop_def:
                    stop["cancelled"] = stop_def["cancelled"]
                if "title" in stop_def:
                    stop["title"] = stop_def["title"]
                if "message" in stop_def:
                    stop["message"] = stop_def["message"]
                if "alternateCodes" in stop_def:
                    stop["alternateCodes"] = stop_def["alternateCodes"]
                if "alternateNames" in stop_def:
                    for key, value in stop_def["alternateNames"].items():
                        stop["name"][key] = value
                
                manual_stops.append(stop)
            
            print(f"Loaded {len(manual_stops)} manual stops")
            return manual_stops
    except Exception as e:
        print(f"Error loading manual stops: {e}", file=sys.stderr)
        return []

def main():
    print("Fetching stop list data...")

    # Download stop list data
    url = "https://app.tussa.org/tussa/api/paradas"
    body = json.dumps({ "nombre": "" }).encode('utf-8')
    req = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json'}, method='POST')

    try:
        with urllib.request.urlopen(req) as response:
            content = response.read().decode('utf-8')
            data = json.loads(content)

        print(f"Downloaded {len(data)} stops")

        # Process the data
        processed_stops = []
        for stop in data:
            name = stop.get("nombre", "").strip()

            lines_sinoptic: list[str] = [line.get("sinoptico").strip() for line in stop.get("lineas", [])] if stop.get("lineas") else []
            lines_id: list[str] = []

            for line in lines_sinoptic:
                line_code = line.lstrip('L')
                lines_id.append(line_code)

            processed_stop = {
                "stopId": stop.get("id"),
                "name": {
                    "original": name
                },
                "latitude": stop.get("coordenadas").get("latitud"),
                "longitude": stop.get("coordenadas").get("longitud"),
                "lines": lines_id,
                "hide": len(lines_id) == 0
            }
            processed_stops.append(processed_stop)

        # Load and apply overrides
        script_dir = os.path.dirname(os.path.abspath(__file__))
        overrides_dir = os.path.join(script_dir, OVERRIDES_DIR)
        # For each YML/YAML file in the overrides directory, load and apply the overrides
        for filename in os.listdir(overrides_dir):
            if not filename.endswith(".yml") and not filename.endswith(".yaml"):
                continue

            print(f"Loading overrides from {filename}")
            overrides_file = os.path.join(overrides_dir, filename)
            overrides = load_stop_overrides(overrides_file)
            processed_stops = apply_overrides(processed_stops, overrides)

        # Load and add manual stops
        manual_stops_file = os.path.join(script_dir, OVERRIDES_DIR, "manual-stops.yaml")
        manual_stops = load_manual_stops(manual_stops_file)
        processed_stops.extend(manual_stops)

        # Filter out hidden stops
        visible_stops = [stop for stop in processed_stops if not stop.get("hide")]
        print(f"Removed {len(processed_stops) - len(visible_stops)} hidden stops")

        # Sort stops by ID ascending
        visible_stops.sort(key=lambda x: x["stopId"])

        output_file = os.path.join(script_dir, OUTPUT_FILE)

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(visible_stops, f, ensure_ascii=False, indent=2)

        print(f"Saved processed stops data to {output_file}")
        return 0

    except Exception as e:
        print(f"Error processing stops data: {e}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(main())
