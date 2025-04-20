#!/usr/bin/env python3
import json
import os
import sys
import urllib.request
import yaml  # Add YAML support for overrides

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
                
    return stops

def main():
    print("Fetching stop list data...")
    
    # Download stop list data
    url = "https://datos.vigo.org/vci_api_app/api2.jsp?tipo=TRANSPORTE_PARADAS"
    req = urllib.request.Request(url)
    
    try:
        with urllib.request.urlopen(req) as response:
            # Read the response and decode from ISO-8859-1 to UTF-8
            content = response.read().decode('iso-8859-1')
            data = json.loads(content)
            
        print(f"Downloaded {len(data)} stops")
        
        # Process the data
        processed_stops = []
        for stop in data:
            processed_stop = {
                "stopId": stop.get("id"),
                "name": {
                    "original": stop.get("nombre", "")
                },
                "latitude": stop.get("lat"),
                "longitude": stop.get("lon"),
                "lines": [line.strip() for line in stop.get("lineas", "").split(",")] if stop.get("lineas") else []
            }
            processed_stops.append(processed_stop)
        
        # Load and apply overrides
        script_dir = os.path.dirname(os.path.abspath(__file__))
        overrides_dir = os.path.join(script_dir, "overrides")
        # For each YML/YAML file in the overrides directory, load and apply the overrides
        for filename in os.listdir(overrides_dir):
            if not filename.endswith(".yml") and not filename.endswith(".yaml"):
                continue

            print(f"Loading overrides from {filename}")
            overrides_file = os.path.join(overrides_dir, filename)
            overrides = load_stop_overrides(overrides_file)
            processed_stops = apply_overrides(processed_stops, overrides)
        
        # Filter out hidden stops
        visible_stops = [stop for stop in processed_stops if not stop.get("hide")]
        print(f"Removed {len(processed_stops) - len(visible_stops)} hidden stops")
        
        # Save to public directory
        output_file = os.path.join(script_dir, "..", "public", "stops.json")
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(visible_stops, f, ensure_ascii=False, indent=2)
            
        print(f"Saved processed stops data to {output_file}")
        return 0
        
    except Exception as e:
        print(f"Error processing stops data: {e}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(main())