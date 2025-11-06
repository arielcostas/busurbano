# Manual Stops and Enhanced Overrides - User Guide

This guide explains how to use the new manual stops and enhanced override features added to Busurbano.

## Overview

Busurbano now supports two powerful features for customizing stop data:
1. **Manual Stops**: Add completely new stops that don't exist in the transit API
2. **Enhanced Overrides**: Add alerts, status messages, and alternative stop codes to existing stops

## Manual Stops

Manual stops allow you to add new bus stops to the system that aren't provided by the official transit API.

### How to Add Manual Stops

1. Navigate to `data/{region}/overrides/` (e.g., `data/vigo/overrides/`)
2. Edit `manual-stops.yaml`
3. Add your stop definition using the following format:

```yaml
99999:  # Choose a unique stop ID (use high numbers to avoid conflicts)
  name: "My New Stop Name"
  location:
    latitude: 42.229188    # Required: latitude coordinate
    longitude: -8.722469   # Required: longitude coordinate
  lines:                   # Required: list of lines serving this stop
    - "5"
    - "12"
  amenities:              # Optional: available amenities
    - shelter
    - display
  title: "New Stop"       # Optional: alert title
  message: "This stop was recently added to serve the new development."  # Optional: message
```

4. Run the download script to regenerate the stops JSON:
   ```bash
   cd data/vigo  # or data/santiago
   python3 download-stops.py
   ```

### Important Notes for Manual Stops
- Choose stop IDs that won't conflict with existing stops (use high numbers like 90000+)
- Location coordinates (latitude, longitude) are **required**
- At least one line is **required**
- The stop will appear on the map and in the stop list after regenerating the JSON

## Enhanced Overrides

Overrides allow you to modify existing stops from the transit API or add additional information.

### Available Override Fields

```yaml
5520:  # Existing stop ID
  name: "New Stop Name"           # Override the stop name
  cancelled: true                 # Mark stop as out of service
  title: "Stop Temporarily Closed"  # Alert title shown to users
  message: "This stop is closed for construction. Use stop 5530 instead."  # Detailed message
  alternateCodes:                 # Suggest alternative stops
    - "5530"
    - "6620"
  location:                       # Override coordinates
    latitude: 42.237485586
    longitude: -8.719397801
  amenities:                      # Add/override amenities
    - shelter
    - display
  hide: true                      # Hide stop from map and lists
```

### Use Cases

#### 1. Temporary Stop Closure
When a stop is temporarily closed, notify users and suggest alternatives:

```yaml
5530:
  cancelled: true
  title: "Stop Temporarily Closed"
  message: "This stop is closed for street repairs until January 15, 2026. Please use stop 6620 (100m south)."
  alternateCodes:
    - "6620"
```

#### 2. Stop Relocation
When a stop is moved to a new location:

```yaml
6620:
  title: "Stop Relocated"
  message: "This stop has been moved 30 meters north to improve safety. Look for the new shelter."
  location:
    latitude: 42.237500
    longitude: -8.719400
```

#### 3. Service Change Notification
Inform users about service changes:

```yaml
12345:
  title: "Service Change"
  message: "Starting January 1, Line 8 will no longer stop here. Use stop 12346 for Line 8 service."
  alternateCodes:
    - "12346"
```

#### 4. Stop Improvement
Notify users about improvements:

```yaml
5520:
  title: "Stop Upgraded"
  message: "This stop has been upgraded with a new shelter and real-time information display."
  amenities:
    - shelter
    - display
```

## Frontend Display

### Map Page (Small Sheet)
When you tap a stop on the map, alerts are displayed between the line icons and real-time estimates:

```
[Stop Name] (5520)
[Line Icons: 1, 2, 3]

┌─────────────────────────────────┐
│ ⚠️  Stop Temporarily Closed     │
│                                 │
│ This stop is closed for street  │
│ repairs. Use stop 5530 instead. │
│ Alternative stops: 5530         │
└─────────────────────────────────┘

Next arrivals:
Line 1 → Downtown - 5 min
...
```

### Estimates Page
Alerts are shown prominently before the estimates table:

```
★ García Barbón, 7 (5520)

┌─────────────────────────────────┐
│ ⚠️  Stop Temporarily Closed     │
│                                 │
│ This stop is closed for street  │
│ repairs. Use stop 5530 instead. │
│ Alternative stops: 5530         │
└─────────────────────────────────┘

[Estimates Table]
```

## Alert Styling

- **Error/Cancelled** (red): Shows when `cancelled: true`
- **Info** (blue): Shows when there's a message but stop is not cancelled
- **Compact mode**: Used in the map sheet for space efficiency
- **Dark mode**: Automatically adapts colors for dark themes

## Best Practices

1. **Be Clear and Concise**: Keep titles short and messages informative
2. **Provide Alternatives**: Always suggest alternative stops when a stop is closed
3. **Update Regularly**: Remove or update alerts when situations change
4. **Test Changes**: Run the download script and check the generated JSON
5. **Use Appropriate IDs**: For manual stops, use IDs in the 90000+ range to avoid conflicts

## Workflow

1. Edit YAML files in `data/{region}/overrides/`
2. Run `python3 download-stops.py` in the region directory
3. Verify the changes in `src/frontend/public/stops/{region}.json`
4. Commit and deploy the changes

## Examples Repository

See the `data/vigo/overrides/` directory for example files:
- `example-new-features.yaml` - Commented examples of all new features
- `stop-alerts-demo.yaml` - Live example with real stop ID
- `manual-stops.yaml` - Template for adding manual stops

## Troubleshooting

**Stop not appearing?**
- Check that it's not marked as `hide: true`
- Verify the JSON was regenerated
- Ensure coordinates are valid

**Alert not showing?**
- Both `title` OR `message` must be present for alerts to display
- Check the browser console for errors
- Verify the stop ID matches

**Manual stop conflicts?**
- Use high stop IDs (90000+) to avoid conflicts with API stops
- Check that the stop ID is unique in the generated JSON

## Support

For issues or questions, please open an issue on the GitHub repository.
