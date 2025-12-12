## Plan: Implement Route Planning with OTP Integration

This plan introduces a route planning feature by creating a backend proxy for the Vigo OpenTripPlanner API. The backend will standardize responses and manage routing parameters, while the frontend will provide the search UI, map visualization, and local persistence of results.

### Steps

1.  **Backend Config**: Update [AppConfiguration.cs](src/Costasdev.Busurbano.Backend/Configuration/AppConfiguration.cs) and `appsettings.json` with OTP URLs and default routing parameters (e.g., `walkSpeed`, `maxWalkDistance`).
2.  **Backend Models**: Create `OtpResponse` models for deserialization and "Standardized" DTOs (`RoutePlan`, `Itinerary`, `Leg`) in `Types/` to decouple the API.
    - _Note_: The Standardized DTO should convert OTP's "Encoded Polyline" geometry into standard GeoJSON LineStrings for easier consumption by the frontend.
3.  **Backend Service**: Implement `OtpService` to fetch data from the 3 OTP endpoints (Autocomplete, Reverse, Plan) and map them to Standardized DTOs.
    - _Caching_: Implement `IMemoryCache` for Autocomplete and Reverse Geocoding requests to reduce load on the city API.
4.  **Backend Controller**: Create `RoutePlannerController` to expose `/api/planner/*` endpoints, injecting the configured parameters into OTP requests.
5.  **Frontend API**: Create `app/data/PlannerApi.ts` to consume the new backend endpoints.
6.  **Frontend Logic**: Implement a hook to manage route state and persist results to `localStorage` with an expiry check (1-2 hours).
7.  **Frontend UI**: Create `app/routes/planner.tsx` handling three distinct states/views:
    - **Planner Form**: Input for Origin, Destination, and Departure/Arrival time.
    - **Results List**: A summary list of available itineraries (walking duration, bus lines, total time).
    - **Result Detail**: A map view with a non-modal bottom sheet displaying precise step-by-step instructions (walk to X, take line Y, etc.).
8.  **Frontend Routing**: Register the new `/planner` route in [app/routes.tsx](src/frontend/app/routes.tsx).

### Further Considerations

1.  **Caching**: Confirmed. We will use `IMemoryCache` in the backend for geocoding services as a stopgap until a custom solution is built.
2.  **Map Geometry**: The backend will handle the decoding of OTP's Encoded Polyline format, serving standard GeoJSON to the frontend.
3.  **Error Handling**: In case of errors (no route found, service down), the UI will display a large, friendly explanatory message occupying the main content area.
