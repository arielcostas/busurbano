import maplibregl from "maplibre-gl";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Map, {
  AttributionControl,
  Marker,
  type MapRef,
} from "react-map-gl/maplibre";
import { useApp } from "~/AppContext";
import { getLineColor } from "~/data/LineColors";
import type { RegionId } from "~/data/RegionConfig";
import type { Stop } from "~/data/StopDataProvider";
import { loadStyle } from "~/maps/styleloader";
import "./StopMapSheet.css";

export interface Position {
  latitude: number;
  longitude: number;
  orientationDegrees: number;
}

export interface ConsolidatedCirculationForMap {
  line: string;
  route: string;
  currentPosition?: Position;
}

interface StopMapProps {
  stop: Stop;
  circulations: ConsolidatedCirculationForMap[];
  region: RegionId;
}

export const StopMap: React.FC<StopMapProps> = ({
  stop,
  circulations,
  region,
}) => {
  const { theme } = useApp();
  const [styleSpec, setStyleSpec] = useState<any | null>(null);
  const mapRef = useRef<MapRef | null>(null);
  const hasFitBounds = useRef(false);
  const [userPosition, setUserPosition] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null>(null);
  const geoWatchId = useRef<number | null>(null);
  const [zoom, setZoom] = useState<number>(16);
  const [moveTick, setMoveTick] = useState<number>(0);

  type Pt = { lat: number; lon: number };
  const haversineKm = (a: Pt, b: Pt) => {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lon - a.lon) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const h =
      sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  };
  const computeFocusPoints = (): Pt[] => {
    const buses: Pt[] = [];
    for (const c of busPositions) {
      if (c.currentPosition)
        buses.push({
          lat: c.currentPosition.latitude,
          lon: c.currentPosition.longitude,
        });
    }
    const stopPt =
      stop.latitude && stop.longitude
        ? { lat: stop.latitude, lon: stop.longitude }
        : null;
    const userPt = userPosition
      ? { lat: userPosition.latitude, lon: userPosition.longitude }
      : null;

    if (buses.length === 0 && !stopPt && !userPt) return [];

    // Choose anchor for proximity: stop > user > average of buses
    let anchor: Pt | null = stopPt || userPt || null;
    if (!anchor && buses.length) {
      let lat = 0,
        lon = 0;
      for (const b of buses) {
        lat += b.lat;
        lon += b.lon;
      }
      anchor = { lat: lat / buses.length, lon: lon / buses.length };
    }

    const nearBuses = buses
      .map((p) => ({ p, d: anchor ? haversineKm(anchor, p) : 0 }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 8) // take closest N
      .filter((x) => x.d <= 8) // within 8km
      .map((x) => x.p);

    const pts: Pt[] = [];
    if (stopPt) pts.push(stopPt);
    pts.push(...nearBuses);
    if (userPt) {
      // include user if not too far from anchor
      const includeUser = anchor ? haversineKm(anchor, userPt) <= 10 : true;
      if (includeUser) pts.push(userPt);
    }
    // Fallback: if no buses survived, at least return stop or user
    if (pts.length === 0) {
      if (stopPt) return [stopPt];
      if (userPt) return [userPt];
    }
    return pts;
  };

  useEffect(() => {
    let mounted = true;
    loadStyle("openfreemap", theme)
      .then((style) => {
        if (mounted) setStyleSpec(style);
      })
      .catch((err) => console.error("Failed to load map style", err));
    return () => {
      mounted = false;
    };
  }, [theme]);

  // Geolocation: request immediately without blocking UI; update when available.
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPosition({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 15000, timeout: 5000 }
      );
      geoWatchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          setUserPosition({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
      );
    } catch {}
    return () => {
      if (geoWatchId.current != null && "geolocation" in navigator) {
        try {
          navigator.geolocation.clearWatch(geoWatchId.current);
        } catch {}
      }
    };
  }, []);

  const center = useMemo(() => {
    if (stop.latitude && stop.longitude) {
      return { latitude: stop.latitude, longitude: stop.longitude };
    }
    // fallback to first available bus position
    const pos = circulations.find((c) => c.currentPosition)?.currentPosition;
    return pos
      ? { latitude: pos.latitude, longitude: pos.longitude }
      : { latitude: 42.2406, longitude: -8.7207 }; // Vigo approx fallback
  }, [stop.latitude, stop.longitude, circulations]);

  const busPositions = useMemo(
    () => circulations.filter((c) => !!c.currentPosition),
    [circulations]
  );

  // Fit bounds to stop + buses, with ~1km padding each side, with a modest animation
  // Only fit bounds on the first load, not on subsequent updates
  useEffect(() => {
    if (!styleSpec || !mapRef.current || hasFitBounds.current) return;

    const points = computeFocusPoints();
    if (points.length === 0) return;

    let minLat = points[0].lat,
      maxLat = points[0].lat,
      minLon = points[0].lon,
      maxLon = points[0].lon;
    for (const p of points) {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lon < minLon) minLon = p.lon;
      if (p.lon > maxLon) maxLon = p.lon;
    }

    const sw = [minLon, minLat] as [number, number];
    const ne = [maxLon, maxLat] as [number, number];
    const bounds = new maplibregl.LngLatBounds(sw, ne);

    // Determine predominant bus quadrant relative to stop to bias padding.
    const padding:
      | number
      | { top: number; right: number; bottom: number; left: number } = 24;

    // If the diagonal is huge (likely outliers sneaked in), clamp via zoom fallback
    try {
      if (points.length === 1) {
        const only = points[0];
        mapRef.current
          .getMap()
          .jumpTo({ center: [only.lon, only.lat], zoom: 16 });
      } else {
        mapRef.current.fitBounds(bounds, {
          padding: padding as any,
          duration: 700,
          maxZoom: 17,
        } as any);
      }
      hasFitBounds.current = true;
    } catch {}
  }, [styleSpec, stop.latitude, stop.longitude, busPositions, userPosition]);

  const handleCenter = () => {
    if (!mapRef.current) return;
    const pts = computeFocusPoints();
    if (pts.length === 0) return;

    let minLat = pts[0].lat,
      maxLat = pts[0].lat,
      minLon = pts[0].lon,
      maxLon = pts[0].lon;
    for (const p of pts) {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lon < minLon) minLon = p.lon;
      if (p.lon > maxLon) maxLon = p.lon;
    }

    const sw = [minLon, minLat] as [number, number];
    const ne = [maxLon, maxLat] as [number, number];
    const bounds = new maplibregl.LngLatBounds(sw, ne);

    const padding:
      | number
      | { top: number; right: number; bottom: number; left: number } = 24;

    try {
      if (pts.length === 1) {
        const only = pts[0];
        mapRef.current
          .getMap()
          .easeTo({ center: [only.lon, only.lat], zoom: 16, duration: 450 });
      } else {
        mapRef.current.fitBounds(bounds, {
          padding: padding as any,
          duration: 500,
          maxZoom: 17,
        } as any);
      }
    } catch {}
  };

  return (
    <div className="stop-map-container">
      {styleSpec && (
        <Map
          mapLib={maplibregl as any}
          initialViewState={{
            latitude: center.latitude,
            longitude: center.longitude,
            zoom: 16,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={styleSpec}
          attributionControl={false}
          ref={mapRef}
          onMove={(e) => {
            setZoom(e.viewState.zoom);
            setMoveTick((t) => (t + 1) % 1000000);
          }}
        >
          {/* Compact attribution (closed by default) */}
          <AttributionControl position="bottom-left" compact />

          {/* Stop marker (center) */}
          {stop.latitude && stop.longitude && (
            <Marker
              longitude={stop.longitude}
              latitude={stop.latitude}
              anchor="bottom"
            >
              <div title={`Stop ${stop.stopId}`}>
                <svg width="28" height="36" viewBox="0 0 28 36">
                  <defs>
                    <filter
                      id="drop"
                      x="-20%"
                      y="-20%"
                      width="140%"
                      height="140%"
                    >
                      <feDropShadow
                        dx="0"
                        dy="1"
                        stdDeviation="1"
                        flood-opacity="0.35"
                      />
                    </filter>
                  </defs>
                  <path
                    d="M14 0C6.82 0 1 5.82 1 13c0 8.5 11 23 13 23s13-14.5 13-23C27 5.82 21.18 0 14 0z"
                    fill="#1976d2"
                    stroke="#fff"
                    strokeWidth="2"
                    filter="url(#drop)"
                  />
                  <circle cx="14" cy="13" r="5" fill="#fff" />
                  <circle cx="14" cy="13" r="3" fill="#1976d2" />
                </svg>
              </div>
            </Marker>
          )}

          {/* User position marker (if available) */}
          {userPosition && (
            <Marker
              longitude={userPosition.longitude}
              latitude={userPosition.latitude}
              anchor="center"
            >
              <div className="user-dot" title="Your location">
                <div className="user-dot__pulse" />
                <div className="user-dot__core" />
              </div>
            </Marker>
          )}

          {/* Bus markers with heading and dynamic label spacing */}
          {(() => {
            const map = mapRef.current?.getMap();
            const baseGap = 6;
            const thresholdPx = 22;
            const gaps: number[] = new Array(busPositions.length).fill(baseGap);
            if (map && zoom >= 14.5 && busPositions.length > 1) {
              const pts = busPositions.map((c) =>
                c.currentPosition
                  ? map.project([
                      c.currentPosition.longitude,
                      c.currentPosition.latitude,
                    ])
                  : null
              );
              for (let i = 0; i < pts.length; i++) {
                const pi = pts[i];
                if (!pi) continue;
                let close = 0;
                for (let j = 0; j < pts.length; j++) {
                  if (i === j) continue;
                  const pj = pts[j];
                  if (!pj) continue;
                  const dx = pi.x - pj.x;
                  const dy = pi.y - pj.y;
                  if (dx * dx + dy * dy <= thresholdPx * thresholdPx) close++;
                }
                gaps[i] = baseGap + Math.min(3, close) * 10;
              }
            }

            return busPositions.map((c, idx) => {
              const p = c.currentPosition!;
              const lineColor = getLineColor(region, c.line);
              const showLabel = zoom >= 13;
              const labelGap = gaps[idx] ?? baseGap;
              return (
                <Marker
                  key={idx}
                  longitude={p.longitude}
                  latitude={p.latitude}
                  anchor="center"
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: labelGap,
                      transform: `rotate(${p.orientationDegrees}deg)`,
                      transformOrigin: "center center",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      style={{
                        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
                      }}
                    >
                      <path
                        d="M12 2 L20 22 L12 18 L4 22 Z"
                        fill={lineColor.background}
                        stroke="#fff"
                        strokeWidth="1.5"
                      />
                    </svg>
                    {showLabel && (
                      <div
                        style={{
                          background: lineColor.background,
                          color: lineColor.text,
                          padding: "2px 4px",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          lineHeight: 1,
                          border: "1px solid #fff",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                          transform: `rotate(${-p.orientationDegrees}deg)`,
                          pointerEvents: "none",
                          zIndex: 0,
                        }}
                      >
                        {c.line}
                      </div>
                    )}
                  </div>
                </Marker>
              );
            });
          })()}
        </Map>
      )}
      {/* Floating controls */}
      <div className="map-floating-controls">
        <button
          type="button"
          aria-label="Center"
          className="center-btn"
          onClick={handleCenter}
          title="Center view"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="3" fill="currentColor" />
            <path
              d="M12 2v3M12 19v3M2 12h3M19 12h3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle
              cx="12"
              cy="12"
              r="8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
