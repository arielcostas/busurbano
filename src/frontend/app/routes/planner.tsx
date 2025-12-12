import maplibregl, { type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import React, { useEffect, useRef, useState } from "react";
import Map, { Layer, Source, type MapRef } from "react-map-gl/maplibre";
import { Sheet } from "react-modal-sheet";
import { useApp } from "~/AppContext";
import { REGION_DATA } from "~/config/RegionConfig";
import {
  searchPlaces,
  type Itinerary,
  type PlannerSearchResult,
} from "~/data/PlannerApi";
import { usePlanner } from "~/hooks/usePlanner";
import { DEFAULT_STYLE, loadStyle } from "~/maps/styleloader";
import "../tailwind-full.css";

// --- Components ---

const AutocompleteInput = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: PlannerSearchResult | null;
  onChange: (val: PlannerSearchResult | null) => void;
  placeholder: string;
}) => {
  const [query, setQuery] = useState(value?.name || "");
  const [results, setResults] = useState<PlannerSearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (value) setQuery(value.name || "");
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 2 && query !== value?.name) {
        const res = await searchPlaces(query);
        setResults(res);
        setShowResults(true);
      } else {
        setResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query, value]);

  return (
    <div className="mb-4 relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          className="w-full p-2 border rounded shadow-sm"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value) onChange(null);
          }}
          placeholder={placeholder}
          onFocus={() => setShowResults(true)}
        />
        {value && (
          <button
            onClick={() => {
              setQuery("");
              onChange(null);
            }}
            className="px-2 text-gray-500"
          >
            ✕
          </button>
        )}
      </div>
      {showResults && results.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border rounded shadow-lg mt-1 max-h-60 overflow-auto">
          {results.map((res, idx) => (
            <li
              key={idx}
              className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
              onClick={() => {
                onChange(res);
                setQuery(res.name || "");
                setShowResults(false);
              }}
            >
              <div className="font-medium">{res.name}</div>
              <div className="text-xs text-gray-500">{res.label}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const ItinerarySummary = ({
  itinerary,
  onClick,
}: {
  itinerary: Itinerary;
  onClick: () => void;
}) => {
  const durationMinutes = Math.round(itinerary.durationSeconds / 60);
  const startTime = new Date(itinerary.startTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = new Date(itinerary.endTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="bg-white p-4 rounded-lg shadow mb-3 cursor-pointer hover:bg-gray-50 border border-gray-200"
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="font-bold text-lg">
          {startTime} - {endTime}
        </div>
        <div className="text-gray-600">{durationMinutes} min</div>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {itinerary.legs.map((leg, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span className="text-gray-400">›</span>}
            <div
              className={`px-2 py-1 rounded text-sm whitespace-nowrap ${
                leg.mode === "WALK"
                  ? "bg-gray-200 text-gray-700"
                  : "bg-blue-600 text-white"
              }`}
            >
              {leg.mode === "WALK" ? "Walk" : leg.routeShortName || leg.mode}
            </div>
          </React.Fragment>
        ))}
      </div>
      <div className="text-sm text-gray-500 mt-1">
        Walk: {Math.round(itinerary.walkDistanceMeters)}m
      </div>
    </div>
  );
};

const ItineraryDetail = ({
  itinerary,
  onClose,
}: {
  itinerary: Itinerary;
  onClose: () => void;
}) => {
  const mapRef = useRef<MapRef>(null);
  const [sheetOpen, setSheetOpen] = useState(true);

  // Prepare GeoJSON for the route
  const routeGeoJson = {
    type: "FeatureCollection",
    features: itinerary.legs.map((leg) => ({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: leg.geometry?.coordinates || [],
      },
      properties: {
        mode: leg.mode,
        color: leg.mode === "WALK" ? "#9ca3af" : "#2563eb", // Gray for walk, Blue for transit
      },
    })),
  };

  // Fit bounds on mount
  useEffect(() => {
    if (mapRef.current && itinerary.legs.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      itinerary.legs.forEach((leg) => {
        leg.geometry?.coordinates.forEach((coord) => {
          bounds.extend([coord[0], coord[1]]);
        });
      });
      mapRef.current.fitBounds(bounds, { padding: 50 });
    }
  }, [itinerary]);

  const { theme } = useApp();

  const [mapStyle, setMapStyle] = useState<StyleSpecification>(DEFAULT_STYLE);
  useEffect(() => {
    //const styleName = "carto";
    const styleName = "openfreemap";
    loadStyle(styleName, theme)
      .then((style) => setMapStyle(style))
      .catch((error) => console.error("Failed to load map style:", error));
  }, [theme]);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="relative flex-1">
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: REGION_DATA.defaultCenter.lng,
            latitude: REGION_DATA.defaultCenter.lat,
            zoom: 13,
          }}
          mapStyle={mapStyle}
          attributionControl={false}
        >
          <Source id="route" type="geojson" data={routeGeoJson as any}>
            <Layer
              id="route-line"
              type="line"
              layout={{
                "line-join": "round",
                "line-cap": "round",
              }}
              paint={{
                "line-color": ["get", "color"],
                "line-width": 5,
              }}
            />
          </Source>
          {/* Markers for start/end/transfers could be added here */}
        </Map>

        <button
          onClick={onClose}
          className="absolute top-4 left-4 bg-white p-2 rounded-full shadow z-10"
        >
          ← Back
        </button>
      </div>

      <Sheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        detent="content"
        initialSnap={0}
      >
        <Sheet.Container>
          <Sheet.Header />
          <Sheet.Content className="px-4 pb-4 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Itinerary Details</h2>
            <div className="space-y-4">
              {itinerary.legs.map((leg, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        leg.mode === "WALK"
                          ? "bg-gray-200 text-gray-700"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {leg.mode === "WALK" ? "🚶" : "🚌"}
                    </div>
                    {idx < itinerary.legs.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gray-300 my-1"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="font-bold">
                      {leg.mode === "WALK"
                        ? "Walk"
                        : `${leg.routeShortName} ${leg.headsign}`}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(leg.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" - "}
                      {new Date(leg.endTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-sm mt-1">
                      {leg.mode === "WALK" ? (
                        <span>
                          Walk {Math.round(leg.distanceMeters)}m to{" "}
                          {leg.to?.name}
                        </span>
                      ) : (
                        <span>
                          From {leg.from?.name} to {leg.to?.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop onTap={() => setSheetOpen(false)} />
      </Sheet>
    </div>
  );
};

// --- Main Page ---

export default function PlannerPage() {
  const {
    origin,
    setOrigin,
    destination,
    setDestination,
    plan,
    loading,
    error,
    searchRoute,
    clearRoute,
  } = usePlanner();

  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(
    null
  );

  const handleSearch = () => {
    if (origin && destination) {
      searchRoute(origin, destination);
    }
  };

  if (selectedItinerary) {
    return (
      <ItineraryDetail
        itinerary={selectedItinerary}
        onClose={() => setSelectedItinerary(null)}
      />
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto pb-20">
      <h1 className="text-2xl font-bold mb-4">Route Planner</h1>

      {/* Form */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <AutocompleteInput
          label="From"
          value={origin}
          onChange={setOrigin}
          placeholder="Search origin..."
        />
        <AutocompleteInput
          label="To"
          value={destination}
          onChange={setDestination}
          placeholder="Search destination..."
        />

        <button
          onClick={handleSearch}
          disabled={!origin || !destination || loading}
          className={`w-full py-3 rounded font-bold text-white ${
            !origin || !destination || loading
              ? "bg-gray-400"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Calculating..." : "Find Route"}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {plan && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Results</h2>
            <button onClick={clearRoute} className="text-sm text-red-500">
              Clear
            </button>
          </div>

          {plan.itineraries.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <div className="text-4xl mb-2">😕</div>
              <h3 className="text-lg font-bold mb-1">No routes found</h3>
              <p className="text-gray-600">
                We couldn't find a route for your trip. Try changing the time or
                locations.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {plan.itineraries.map((itinerary, idx) => (
                <ItinerarySummary
                  key={idx}
                  itinerary={itinerary}
                  onClick={() => setSelectedItinerary(itinerary)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
