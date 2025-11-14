import maplibregl from "maplibre-gl";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl/maplibre";
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
    [circulations],
  );

  // Fit bounds to stop + buses, with ~1km padding each side, with a modest animation
  // Only fit bounds on the first load, not on subsequent updates
  useEffect(() => {
    if (!styleSpec || !mapRef.current || hasFitBounds.current) return;

    const points: { lat: number; lon: number }[] = [];
    if (stop.latitude && stop.longitude) {
      points.push({ lat: stop.latitude, lon: stop.longitude });
    }
    for (const c of busPositions) {
      if (c.currentPosition) {
        points.push({
          lat: c.currentPosition.latitude,
          lon: c.currentPosition.longitude,
        });
      }
    }
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

    // ~1km in degrees
    const kmToDegLat = 1.0 / 111.32; // ≈0.008983
    const centerLat = (minLat + maxLat) / 2;
    const kmToDegLon = kmToDegLat / Math.max(Math.cos((centerLat * Math.PI) / 180), 0.1);
    const padLat = kmToDegLat;
    const padLon = kmToDegLon;

    const sw = [minLon - padLon, minLat - padLat] as [number, number];
    const ne = [maxLon + padLon, maxLat + padLat] as [number, number];
    const bounds = new maplibregl.LngLatBounds(sw, ne);

    try {
      mapRef.current.fitBounds(bounds, {
        padding: 32,
        duration: 700,
        maxZoom: 17,
      } as any);
      hasFitBounds.current = true;
    } catch {}
  }, [styleSpec, stop.latitude, stop.longitude, busPositions]);

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
        >
          <NavigationControl position="top-left" />

          {/* Stop marker (center) */}
          {stop.latitude && stop.longitude && (
            <Marker
              longitude={stop.longitude}
              latitude={stop.latitude}
              anchor="bottom"
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  background: "#1976d2",
                  border: "2px solid white",
                  borderRadius: "5%",
                  boxShadow: "0 0 0 2px rgba(0,0,0,0.2)",
                }}
                title={`Stop ${stop.stopId}`}
              />
            </Marker>
          )}

          {/* Bus markers with heading */}
          {busPositions.map((c, idx) => {
            const p = c.currentPosition!;
            const lineColor = getLineColor(region, c.line);
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
                    gap: 2,
                    transform: `rotate(${p.orientationDegrees}deg)`,
                    transformOrigin: "center center",
                  }}
                >
                  {/* Line number above */}
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
                    }}
                  >
                    {c.line}
                  </div>
                  {/* Arrow pointing direction */}
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
                </div>
              </Marker>
            );
          })}
        </Map>
      )}
    </div>
  );
};
