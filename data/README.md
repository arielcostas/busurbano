# Bus Stop Overrides and Manual Stops

This directory contains YAML files for overriding properties of existing bus stops and manually adding new stops.

## Overrides Format

Overrides modify or extend properties of existing stops from the transit API.

```yaml
stopId:            # Numeric ID of the stop to override
    name:            # Override the name (string)
    alternateNames:  # Additional names for the stop (map)
        key:         # e.g. name used in metro maps
    location:        # Override location coordinates (map)
        latitude:      # New latitude value (float)
        longitude:     # New longitude value (float)
    hide:            # Hide the stop from the map and list (boolean)
    amenities:       # List of amenities available at this stop (list)
        - shelter
        - display
    cancelled:       # Mark stop as cancelled/out of service (boolean)
    title:           # Alert title shown to users (string)
    message:         # Alert message shown to users (string)
    alternateCodes:  # Alternative stop codes (list of strings)
        - "ALT-123"
```

## Adding New Stops

New stops that don't exist in the transit API can be added directly in override files using the `new: true` parameter. The `new` parameter is automatically removed after the stop is added to the list.

```yaml
stopId:            # Numeric ID for the new stop (must not conflict with existing stops)
    new: true        # Mark this as a new stop (required, will be removed after processing)
    name:            # Name of the stop (string)
    location:        # Location coordinates (required for new stops)
        latitude:      # Latitude coordinate (float)
        longitude:     # Longitude coordinate (float)
    lines:           # List of lines serving this stop (list of strings)
        - "1"
        - "2"
    amenities:       # Optional: List of amenities (list)
        - shelter
    title:           # Optional: Alert title (string)
    message:         # Optional: Alert message (string)
    cancelled:       # Optional: Mark as cancelled (boolean)
    alternateCodes:  # Optional: Alternative stop codes (list)
```

## Field Descriptions

- **stopId** (integer): Unique identifier of the bus stop.  
- **new** (boolean): Set to `true` to add a new stop that doesn't exist in the API. This parameter is removed after processing.
- **name** (string): Override or set the stop name.
- **alternateNames** (object): Other names used in different contexts.
    - **key** (string): Name used in a specific context, such as `metro`.
- **location** (object):
    - **latitude** (float): Override/set latitude coordinate.  
    - **longitude** (float): Override/set longitude coordinate.  
- **lines** (array of strings): List of line numbers serving this stop (required for new stops).
- **hide** (boolean): Set to `true` to exclude the stop from maps and listings.  
- **cancelled** (boolean): Set to `true` to mark the stop as cancelled or out of service.
- **title** (string): Alert title displayed to users (e.g., "Stop Temporarily Closed").
- **message** (string): Detailed message about the stop status or alert.
- **alternateCodes** (array of strings): Alternative stop codes or identifiers.
- **amenities** (array of strings): Amenities available at this stop, such as `shelter` or `display`.

## Examples

### Override Example

```yaml
12345:
    name: "Central Station"
    alternateNames:
        metro: "Main Hub"
    location:
        latitude: 40.712776
        longitude: -74.005974
    hide: false
    amenities:
        - shelter
        - display
    title: "Stop Relocated"
    message: "This stop has been temporarily moved 50 meters north."
```

### New Stop Example

```yaml
99999:
    new: true
    name: "New Development Stop"
    location:
        latitude: 42.229188
        longitude: -8.722469
    lines:
        - "5"
        - "12"
    amenities:
        - shelter
```

### Cancelled Stop Example

```yaml
54321:
    cancelled: true
    title: "Stop Out of Service"
    message: "This stop is temporarily closed for construction. Use stop 54322 (100m south) instead."
    alternateCodes:
        - "54322"
```
