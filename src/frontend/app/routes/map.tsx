import StopDataProvider, { type Stop } from "../data/StopDataProvider";
import "./map.css";

import { DEFAULT_STYLE, loadStyle } from "app/maps/styleloader";
import type { Feature as GeoJsonFeature, Point } from "geojson";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Map, {
  GeolocateControl,
  Layer,
  NavigationControl,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
  type StyleSpecification,
} from "react-map-gl/maplibre";
import { StopSheet } from "~/components/StopSummarySheet";
import { REGION_DATA } from "~/config/RegionConfig";
import { usePageTitle } from "~/contexts/PageTitleContext";
import { useApp } from "../AppContext";

// Componente principal del mapa
export default function StopMap() {
  const { t } = useTranslation();
  usePageTitle(t("navbar.map", "Mapa"));
  const [stops, setStops] = useState<
    GeoJsonFeature<
      Point,
      {
        stopId: string;
        name: string;
        lines: string[];
        cancelled?: boolean;
        prefix: string;
      }
    >[]
  >([]);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { mapState, updateMapState, theme } = useApp();
  const mapRef = useRef<MapRef>(null);

  // Style state for Map component
  const [mapStyle, setMapStyle] = useState<StyleSpecification>(DEFAULT_STYLE);

  // Handle click events on clusters and individual stops
  const onMapClick = (e: MapLayerMouseEvent) => {
    const features = e.features;
    if (!features || features.length === 0) {
      console.debug(
        "No features found on map click. Position:",
        e.lngLat,
        "Point:",
        e.point
      );
      return;
    }
    const feature = features[0];
    console.debug("Map click feature:", feature);
    const props: any = feature.properties;

    handlePointClick(feature);
  };

  useEffect(() => {
    StopDataProvider.getStops().then((data) => {
      const features: GeoJsonFeature<
        Point,
        {
          stopId: string;
          name: string;
          lines: string[];
          cancelled?: boolean;
          prefix: string;
        }
      >[] = data.map((s) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [s.longitude as number, s.latitude as number],
        },
        properties: {
          stopId: s.stopId,
          name: s.name.original,
          lines: s.lines,
          cancelled: s.cancelled ?? false,
          prefix: s.stopId.startsWith("renfe:")
            ? "stop-renfe"
            : s.cancelled
              ? "stop-vitrasa-cancelled"
              : "stop-vitrasa",
        },
      }));
      setStops(features);
    });
  }, []);

  useEffect(() => {
    //const styleName = "carto";
    const styleName = "openfreemap";
    loadStyle(styleName, theme)
      .then((style) => setMapStyle(style))
      .catch((error) => console.error("Failed to load map style:", error));
  }, [theme]);

  useEffect(() => {
    const handleMapChange = () => {
      if (!mapRef.current) return;
      const map = mapRef.current.getMap();
      if (!map) return;
      const center = map.getCenter();
      const zoom = map.getZoom();
      updateMapState([center.lat, center.lng], zoom);
    };

    const handleStyleImageMissing = (e: any) => {
      // Suppress warnings for missing sprite images from base style
      // This prevents console noise from OpenFreeMap's missing icons
      if (!mapRef.current) return;
      const map = mapRef.current.getMap();
      if (!map || map.hasImage(e.id)) return;

      // Log warning for our own icons if they are missing
      if (e.id.startsWith("stop-")) {
        console.warn(`Missing icon image: ${e.id}`);
      }

      // Add a transparent 1x1 placeholder to prevent repeated warnings
      map.addImage(e.id, {
        width: 1,
        height: 1,
        data: new Uint8Array(4),
      });
    };

    if (mapRef.current) {
      const map = mapRef.current.getMap();
      if (map) {
        map.on("moveend", handleMapChange);
        map.on("styleimagemissing", handleStyleImageMissing);
      }
    }

    return () => {
      if (mapRef.current) {
        const map = mapRef.current.getMap();
        if (map) {
          map.off("moveend", handleMapChange);
          map.off("styleimagemissing", handleStyleImageMissing);
        }
      }
    };
  }, [mapRef.current]);

  const getLatitude = (center: any) =>
    Array.isArray(center) ? center[0] : center.lat;
  const getLongitude = (center: any) =>
    Array.isArray(center) ? center[1] : center.lng;

  const handlePointClick = (feature: any) => {
    const props: any = feature.properties;
    if (!props || !props.stopId) {
      console.warn("Invalid feature properties:", props);
      return;
    }

    const stopId = props.stopId;

    // fetch full stop to get lines array
    StopDataProvider.getStopById(stopId)
      .then((stop) => {
        if (!stop) {
          console.warn("Stop not found:", stopId);
          return;
        }
        setSelectedStop(stop);
        setIsSheetOpen(true);
      })
      .catch((err) => {
        console.error("Error fetching stop details:", err);
      });
  };

  return (
    <Map
      mapStyle={mapStyle}
      style={{ width: "100%", height: "100%" }}
      interactiveLayerIds={["stops", "stops-label"]}
      onClick={onMapClick}
      minZoom={11}
      scrollZoom
      pitch={0}
      roll={0}
      ref={mapRef}
      initialViewState={{
        latitude: getLatitude(mapState.center),
        longitude: getLongitude(mapState.center),
        zoom: mapState.zoom,
      }}
      attributionControl={{ compact: false }}
      maxBounds={[REGION_DATA.bounds.sw, REGION_DATA.bounds.ne]}
    >
      <NavigationControl position="top-right" />
      <GeolocateControl
        position="top-right"
        trackUserLocation={true}
        positionOptions={{ enableHighAccuracy: false }}
      />

      <Source
        id="stops-source"
        type="geojson"
        data={{ type: "FeatureCollection", features: stops }}
      />

      <Layer
        id="stops"
        type="symbol"
        minzoom={11}
        source="stops-source"
        layout={{
          "icon-image": ["get", "prefix"],
          "icon-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            13,
            0.7,
            16,
            0.8,
            18,
            1.2,
          ],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        }}
      />

      <Layer
        id="stops-label"
        type="symbol"
        source="stops-source"
        minzoom={16}
        layout={{
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Bold"],
          "text-offset": [0, 3],
          "text-anchor": "center",
          "text-justify": "center",
          "text-size": ["interpolate", ["linear"], ["zoom"], 11, 8, 22, 16],
        }}
        paint={{
          "text-color": [
            "case",
            ["==", ["get", "prefix"], "stop-renfe"],
            "#870164",
            "#e72b37",
          ],
          "text-halo-color": "#FFF",
          "text-halo-width": 1,
        }}
      />

      {selectedStop && (
        <StopSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          stop={selectedStop}
        />
      )}
    </Map>
  );
}
