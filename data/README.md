# Bus Stop Overrides

This file defines custom overrides for specific bus stops in YAML format.

## Format

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
```

## Field Descriptions

- **stopId** (integer): Unique identifier of the bus stop.  
- **alternateNames** (object): Other names used in different contexts.
    - **key** (string): Name used in a specific context, such as `metro`.
- **location** (object):
    - **latitude** (float): Override latitude coordinate.  
    - **longitude** (float): Override longitude coordinate.  
- **hide** (boolean): Set to `true` to exclude the stop from maps and listings.  
- **amenities** (array of strings): Amenities available at this stop, such as `shelter` or `display`. For now, only those two will be supported in the app.

## Example

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
        - real-time display
```
