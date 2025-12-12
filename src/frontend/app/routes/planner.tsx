import { Coins, CreditCard, Footprints } from "lucide-react";
import maplibregl, { type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Map, { Layer, Marker, Source, type MapRef } from "react-map-gl/maplibre";
import { useLocation } from "react-router";

import { useApp } from "~/AppContext";
import LineIcon from "~/components/LineIcon";
import { PlannerOverlay } from "~/components/PlannerOverlay";
import { REGION_DATA } from "~/config/RegionConfig";
import { type Itinerary } from "~/data/PlannerApi";
import { usePlanner } from "~/hooks/usePlanner";
import { DEFAULT_STYLE, loadStyle } from "~/maps/styleloader";
import "../tailwind-full.css";

const FARE_CASH_PER_BUS = 1.63;
const FARE_CARD_PER_BUS = 0.67;

const formatDistance = (meters: number) => {
  const intMeters = Math.round(meters);
  if (intMeters >= 1000) return `${(intMeters / 1000).toFixed(1)} km`;
  return `${intMeters} m`;
};

const haversineMeters = (a: [number, number], b: [number, number]) => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const sumWalkMetrics = (legs: Itinerary["legs"]) => {
  let meters = 0;
  let minutes = 0;

  legs.forEach((leg) => {
    if (leg.mode === "WALK") {
      if (
        typeof (leg as any).distanceMeters === "number" &&
        (leg as any).distanceMeters > 0
      ) {
        meters += (leg as any).distanceMeters;
      } else if (leg.geometry?.coordinates?.length) {
        for (let i = 1; i < leg.geometry.coordinates.length; i++) {
          const prev = leg.geometry.coordinates[i - 1] as [number, number];
          const curr = leg.geometry.coordinates[i] as [number, number];
          meters += haversineMeters(prev, curr);
        }
      }
      const durationMinutes =
        (new Date(leg.endTime).getTime() - new Date(leg.startTime).getTime()) /
        60000;
      minutes += durationMinutes;
    }
  });

  return { meters, minutes: Math.max(0, Math.round(minutes)) };
};

const ItinerarySummary = ({
  itinerary,
  onClick,
}: {
  itinerary: Itinerary;
  onClick: () => void;
}) => {
  const { t, i18n } = useTranslation();
  const durationMinutes = Math.round(itinerary.durationSeconds / 60);
  const startTime = new Date(itinerary.startTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = new Date(itinerary.endTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const walkTotals = sumWalkMetrics(itinerary.legs);
  const busLegsCount = itinerary.legs.filter(
    (leg) => leg.mode !== "WALK"
  ).length;
  const cashFare = (
    itinerary.cashFareEuro ?? busLegsCount * FARE_CASH_PER_BUS
  ).toFixed(2);
  const cardFare = (
    itinerary.cardFareEuro ?? busLegsCount * FARE_CARD_PER_BUS
  ).toFixed(2);

  // Format currency based on locale (ES/GL: "1,50 €", EN: "€1.50")
  const formatCurrency = (amount: string) => {
    const isSpanishOrGalician =
      i18n.language.startsWith("es") || i18n.language.startsWith("gl");
    return isSpanishOrGalician
      ? t("planner.cash_fare", { amount })
      : t("planner.cash_fare", { amount });
  };

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
        {itinerary.legs.map((leg, idx) => {
          const isWalk = leg.mode === "WALK";
          const legDurationMinutes = Math.max(
            1,
            Math.round(
              (new Date(leg.endTime).getTime() -
                new Date(leg.startTime).getTime()) /
                60000
            )
          );

          const isFirstBusLeg =
            !isWalk &&
            itinerary.legs.findIndex((l) => l.mode !== "WALK") === idx;

          return (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-400">›</span>}
              {isWalk ? (
                <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-800 whitespace-nowrap">
                  <Footprints className="w-4 h-4 text-slate-600" />
                  <span className="font-semibold">
                    {legDurationMinutes} {t("estimates.minutes")}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LineIcon
                    line={leg.routeShortName || leg.routeName || leg.mode || ""}
                    mode="rounded"
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600 mt-1">
        <span>
          {t("planner.walk")}: {formatDistance(walkTotals.meters)}
          {walkTotals.minutes
            ? ` • ${walkTotals.minutes} ${t("estimates.minutes")}`
            : ""}
        </span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-semibold text-slate-700">
            <Coins className="w-4 h-4" />
            {formatCurrency(cashFare)}
          </span>
          <span className="flex items-center gap-1 text-slate-600">
            <CreditCard className="w-4 h-4" />
            {t("planner.card_fare", { amount: cardFare })}
          </span>
        </span>
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
  const { t } = useTranslation();
  const mapRef = useRef<MapRef>(null);
  const { destination: userDestination } = usePlanner();

  const routeGeoJson = {
    type: "FeatureCollection",
    features: itinerary.legs.map((leg) => ({
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: leg.geometry?.coordinates || [],
      },
      properties: {
        mode: leg.mode,
        color:
          leg.mode === "WALK"
            ? "#9ca3af"
            : leg.routeColor
              ? `#${leg.routeColor}`
              : "#2563eb",
      },
    })),
  };

  // Collect unique stops with their roles (board, alight, transfer)
  const stopMarkers = useMemo(() => {
    const stopsMap: Record<
      string,
      {
        lat: number;
        lon: number;
        name: string;
        type: "board" | "alight" | "transfer";
      }
    > = {};

    itinerary.legs.forEach((leg, idx) => {
      if (leg.mode !== "WALK") {
        // Boarding stop
        if (leg.from?.lat && leg.from?.lon) {
          const key = `${leg.from.lat},${leg.from.lon}`;
          if (!stopsMap[key]) {
            const isTransfer =
              idx > 0 && itinerary.legs[idx - 1].mode !== "WALK";
            stopsMap[key] = {
              lat: leg.from.lat,
              lon: leg.from.lon,
              name: leg.from.name || "",
              type: isTransfer ? "transfer" : "board",
            };
          }
        }
        // Alighting stop
        if (leg.to?.lat && leg.to?.lon) {
          const key = `${leg.to.lat},${leg.to.lon}`;
          if (!stopsMap[key]) {
            const isTransfer =
              idx < itinerary.legs.length - 1 &&
              itinerary.legs[idx + 1].mode !== "WALK";
            stopsMap[key] = {
              lat: leg.to.lat,
              lon: leg.to.lon,
              name: leg.to.name || "",
              type: isTransfer ? "transfer" : "alight",
            };
          }
        }
      }
    });

    return Object.values(stopsMap);
  }, [itinerary]);

  // Get origin and destination coordinates
  const origin = itinerary.legs[0]?.from;
  const destination = itinerary.legs[itinerary.legs.length - 1]?.to;

  useEffect(() => {
    if (!mapRef.current) return;

    // Small delay to ensure map is fully loaded
    const timer = setTimeout(() => {
      if (mapRef.current && itinerary.legs.length > 0) {
        const bounds = new maplibregl.LngLatBounds();

        // Add all route coordinates to bounds
        itinerary.legs.forEach((leg) => {
          leg.geometry?.coordinates.forEach((coord) =>
            bounds.extend([coord[0], coord[1]])
          );
        });

        // Ensure bounds are valid before fitting
        if (!bounds.isEmpty()) {
          mapRef.current.fitBounds(bounds, { padding: 80, duration: 1000 });
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [itinerary]);

  const { theme } = useApp();
  const [mapStyle, setMapStyle] = useState<StyleSpecification>(DEFAULT_STYLE);

  useEffect(() => {
    const styleName = "openfreemap";
    loadStyle(styleName, theme)
      .then((style) => setMapStyle(style))
      .catch((error) => console.error("Failed to load map style:", error));
  }, [theme]);

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Map Section */}
      <div className="relative h-2/3 md:h-full md:flex-1">
        <Map
          ref={mapRef}
          initialViewState={{
            longitude:
              origin?.lon || (REGION_DATA.defaultCenter as [number, number])[0],
            latitude:
              origin?.lat || (REGION_DATA.defaultCenter as [number, number])[1],
            zoom: 13,
          }}
          mapStyle={mapStyle}
          attributionControl={false}
        >
          <Source id="route" type="geojson" data={routeGeoJson as any}>
            <Layer
              id="route-line"
              type="line"
              layout={{ "line-join": "round", "line-cap": "round" }}
              paint={{
                "line-color": ["get", "color"],
                "line-width": 5,
                // Dotted for walking segments, solid for bus segments
                "line-dasharray": [
                  "case",
                  ["==", ["get", "mode"], "WALK"],
                  ["literal", [1, 3]],
                  ["literal", [1, 0]],
                ],
              }}
            />
          </Source>

          {/* Origin marker (red) */}
          {origin?.lat && origin?.lon && (
            <Marker longitude={origin.lon} latitude={origin.lat}>
              <div className="w-6 h-6 bg-red-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </Marker>
          )}

          {/* Destination marker (green) */}
          {destination?.lat && destination?.lon && (
            <Marker longitude={destination.lon} latitude={destination.lat}>
              <div className="w-6 h-6 bg-green-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </Marker>
          )}

          {/* Stop markers (boarding, alighting, transfer) */}
          {stopMarkers.map((stop, idx) => (
            <Marker key={idx} longitude={stop.lon} latitude={stop.lat}>
              <div
                className={`w-5 h-5 rounded-full border-2 border-white shadow-md ${
                  stop.type === "board"
                    ? "bg-blue-500"
                    : stop.type === "alight"
                      ? "bg-purple-500"
                      : "bg-orange-500"
                }`}
                title={`${stop.name} (${stop.type})`}
              />
            </Marker>
          ))}

          {/* Intermediate stops (smaller white dots) */}
          {itinerary.legs.map((leg, legIdx) =>
            leg.intermediateStops?.map((stop, stopIdx) => (
              <Marker
                key={`intermediate-${legIdx}-${stopIdx}`}
                longitude={stop.lon}
                latitude={stop.lat}
              >
                <div
                  className="w-3 h-3 rounded-full border border-gray-400 bg-white shadow-sm"
                  title={stop.name || "Intermediate stop"}
                />
              </Marker>
            ))
          )}
        </Map>

        <button
          onClick={onClose}
          className="absolute top-4 left-4 bg-white dark:bg-slate-800 p-2 px-4 rounded-lg shadow-lg z-10 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          {t("planner.back")}
        </button>
      </div>

      {/* Details Panel */}
      <div className="h-1/3 md:h-full md:w-96 lg:w-md overflow-y-auto bg-white dark:bg-slate-900 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700">
        <div className="px-4 py-4">
          <h2 className="text-xl font-bold mb-4">
            {t("planner.itinerary_details")}
          </h2>

          <div>
            {itinerary.legs.map((leg, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex flex-col items-center">
                  {leg.mode === "WALK" ? (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm"
                      style={{ backgroundColor: "#e5e7eb", color: "#374151" }}
                    >
                      <Footprints className="w-4 h-4" />
                    </div>
                  ) : (
                    <div
                      className="shadow-sm"
                      style={{ transform: "scale(0.9)" }}
                    >
                      <LineIcon
                        line={leg.routeShortName || leg.routeName || ""}
                        mode="rounded"
                      />
                    </div>
                  )}
                  {idx < itinerary.legs.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-300 dark:bg-gray-600 my-1"></div>
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="font-bold flex items-center gap-2">
                    {leg.mode === "WALK" ? (
                      t("planner.walk")
                    ) : (
                      <>
                        <span>
                          {leg.headsign ||
                            leg.routeLongName ||
                            leg.routeName ||
                            ""}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(leg.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {(
                      (new Date(leg.endTime).getTime() -
                        new Date(leg.startTime).getTime()) /
                      60000
                    ).toFixed(0)}{" "}
                    {t("estimates.minutes")}
                  </div>
                  <div className="text-sm mt-1">
                    {leg.mode === "WALK" ? (
                      <span>
                        {t("planner.walk_to", {
                          distance: Math.round(leg.distanceMeters) + "m",
                          destination: (() => {
                            const enteredDest = userDestination?.name || "";
                            const finalDest =
                              enteredDest ||
                              itinerary.legs[itinerary.legs.length - 1]?.to
                                ?.name ||
                              "";
                            const raw = leg.to?.name || finalDest || "";
                            const cleaned = raw.trim();
                            const placeholder = cleaned.toLowerCase();
                            // If OTP provided a generic placeholder, use the user's entered destination
                            if (
                              placeholder === "destination" ||
                              placeholder === "destino" ||
                              placeholder === "destinación" ||
                              placeholder === "destinatario"
                            ) {
                              return enteredDest || finalDest;
                            }
                            return cleaned || finalDest;
                          })(),
                        })}
                      </span>
                    ) : (
                      <>
                        <span>
                          {t("planner.from_to", {
                            from: leg.from?.name,
                            to: leg.to?.name,
                          })}
                        </span>
                        {leg.intermediateStops &&
                          leg.intermediateStops.length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
                                {leg.intermediateStops.length}{" "}
                                {leg.intermediateStops.length === 1
                                  ? "stop"
                                  : "stops"}
                              </summary>
                              <ul className="mt-1 ml-4 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                                {leg.intermediateStops.map((stop, idx) => (
                                  <li key={idx}>• {stop.name}</li>
                                ))}
                              </ul>
                            </details>
                          )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PlannerPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const {
    plan,
    searchRoute,
    clearRoute,
    searchTime,
    arriveBy,
    selectedItineraryIndex,
    selectItinerary,
    deselectItinerary,
  } = usePlanner();
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(
    null
  );

  // Show previously selected itinerary when plan loads
  useEffect(() => {
    if (
      plan &&
      selectedItineraryIndex !== null &&
      plan.itineraries[selectedItineraryIndex]
    ) {
      setSelectedItinerary(plan.itineraries[selectedItineraryIndex]);
    }
  }, [plan, selectedItineraryIndex]);

  // When navigating to /planner (even if already on it), reset the active itinerary
  useEffect(() => {
    setSelectedItinerary(null);
    deselectItinerary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  if (selectedItinerary) {
    return (
      <ItineraryDetail
        itinerary={selectedItinerary}
        onClose={() => {
          setSelectedItinerary(null);
          deselectItinerary();
        }}
      />
    );
  }

  // Format search time for display
  const searchTimeDisplay = searchTime
    ? new Date(searchTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="relative max-w-3xl mx-auto px-4 pt-4 pb-8">
      <PlannerOverlay
        forceExpanded
        inline
        onSearch={(origin, destination, time, arriveBy) =>
          searchRoute(origin, destination, time, arriveBy)
        }
      />

      {plan && (
        <div>
          <div className="flex justify-between items-center my-4">
            <div>
              <h2 className="text-xl font-bold">
                {t("planner.results_title")}
              </h2>
              {searchTimeDisplay && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {arriveBy ? t("planner.arrive_by") : t("planner.depart_at")}{" "}
                  {searchTimeDisplay}
                </p>
              )}
            </div>
            <button onClick={clearRoute} className="text-sm text-red-500">
              {t("planner.clear")}
            </button>
          </div>

          {plan.itineraries.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <div className="text-4xl mb-2">😕</div>
              <h3 className="text-lg font-bold mb-1">
                {t("planner.no_routes_found")}
              </h3>
              <p className="text-gray-600">{t("planner.no_routes_message")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {plan.itineraries.map((itinerary, idx) => (
                <ItinerarySummary
                  key={idx}
                  itinerary={itinerary}
                  onClick={() => {
                    selectItinerary(idx);
                    setSelectedItinerary(itinerary);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
