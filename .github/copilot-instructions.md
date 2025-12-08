# Busurbano: AI Coding Agent Guide

Busurbano is a public transit app for urban buses in Spain (currently Vigo). It provides real-time arrival estimates, scheduled timetables, bus stop mapping, and delay data collection.

## Architecture Overview

**Three-component system:**
1. **Backend** (`src/Costasdev.Busurbano.Backend`): ASP.NET Core 9 Web API serving transit data
2. **Frontend** (`src/frontend`): React 19 SPA using react-router v7 (SSR disabled), MapLibre GL, Vite
3. **Python utilities**: GTFS processing (`gtfs_perstop_report`), delay collection daemon (`delay_collector`), stop data downloaders

**Data flow:**
- Frontend fetches stop metadata from static JSON (`/stops/vigo.json`) + real-time estimates from backend `/api/vigo/*` endpoints
- Backend uses [`Costasdev.VigoTransitApi`](https://github.com/arielcostas/VigoTransitApi) for live data, pre-processed Protobuf files (`.pb`) for GTFS schedules/shapes
- Delay collector daemon polls `/api/vigo/GetConsolidatedCirculations` every 30s during service hours, stores to PostgreSQL

## Critical Patterns

**Backend scheduling logic (`Controllers/VigoController.cs`):**
- `GetConsolidatedCirculations` merges real-time estimates with GTFS schedules via fuzzy matching (line + normalized route name)
- Uses EPSG:25829 (UTM zone 29N) for geometric calculations, transforms to WGS84 for API responses
- Schedule files organized by date: `{ScheduleBasePath}/{yyyy-MM-dd}/{stopId}.pb`
- Shape traversal (`Services/ShapeTraversalService.cs`) calculates bus positions by reverse-walking GTFS shape geometries from stop location minus distance

**Frontend multi-region setup (`app/data/RegionConfig.ts`):**
- All region-specific config (endpoints, bounds, colors) defined in `REGIONS` constant
- `RegionId` type enforces compile-time region safety
- localStorage keys namespaced by region: `favouriteStops_{region}`, `customStopNames_{region}`, `recentStops_{region}`

**Stop overrides (`stop_downloader/*/overrides.yaml`):**
- YAML files override stop names, locations, amenities, hide stops, or add alerts
- `new: true` flag creates stops not in transit API (auto-removed after processing)

**Protobuf types (`src/common/stop_schedule.proto`):**
- Auto-generated C# types in `Backend/Types/StopSchedule.cs` (DO NOT EDIT marker)
- Shared `.proto` compiles to both C# and Python where needed

## Development Workflows

**Run entire stack:**
```bash
npm run dev  # Starts both frontend (port 5173) and backend (port 7240) via npm script
```

**Frontend only:**
```bash
cd src/frontend
npm run dev  # Vite dev server with proxy to backend at https://localhost:7240
```

**Backend only:**
```bash
dotnet run --project src/Costasdev.Busurbano.Backend
```

**Formatting/linting:**
- Frontend: `npm run format` (Prettier), `npm run lint:fix` (ESLint) in `src/frontend`
- Python: `ruff format .` and `ruff check .` (configured in `pyproject.toml`)
- C#: Auto-format on save via EditorConfig (`.editorconfig` at root)

**Delay collector:**
```bash
cd src/delay_collector
# Requires PostgreSQL; see DB_SETUP.md for schema setup
# Configure via environment: DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, FREQUENCY_SECONDS
python main.py
```

## Key Conventions

- **No TypeScript barrel exports**: Direct imports from specific files (e.g., `~/components/LineIcon` not `~/components`)
- **Date normalization**: Backend uses `Europe/Madrid` timezone consistently, filters out unparseable times (hour >= 24)
- **Route name matching**: Normalize via `RemoveDiacritics()` + alphanumeric-only before comparing GTFS terminus vs. API route
- **Coordinate systems**: GTFS shapes in EPSG:25829 meters, API responses in WGS84 lat/lng
- **Config separation**: Backend config via `appsettings.json` + user secrets (`App:ScheduleBasePath`), frontend via `RegionConfig.ts`
- **Protobuf over JSON for schedules**: Smaller payloads, faster parsing; JSON used for initial timetable endpoint backward compatibility

## External Dependencies

- **[VigoTransitApi](https://github.com/arielcostas/VigoTransitApi)**: NuGet package wrapping datos.vigo.org real-time API
- **Open data license**: All Vigo transit data under [ODC-BY](https://opendefinition.org/licenses/odc-by/); attribution required
- **MapLibre + OpenFreeMap**: Self-hosted tile server config in frontend, not Mapbox

## Common Pitfalls

- Do NOT edit `Types/StopSchedule.cs` directly (regenerate from `.proto`)
- Frontend expects backend at `https://localhost:7240` in dev (Vite proxy config)
- Schedule `.pb` files must exist for date or `GetConsolidatedCirculations` fails with 404
- Stop metadata changes require regenerating `stops/vigo.json` (manual process, no build step)
- Delay collector silently pauses outside `SERVICE_START_HOUR` to `SERVICE_END_HOUR` (default 7 AM–11 PM Madrid time)

## Files to Ignore

**Generated/lock files (unless making intentional automated changes):**
- `package-lock.json` — Only edit when explicitly updating dependencies
- `stops/<city>.json` — Auto-generated from Python scripts, edit source data instead
- `public/maps/styles/*.json` — MapLibre style configs, managed separately
