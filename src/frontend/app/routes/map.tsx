import StopDataProvider from "../data/StopDataProvider";
import "./map.css";

import { useEffect, useRef, useState } from "react";
import { useApp } from "../AppContext";
import Map, {
  AttributionControl,
  GeolocateControl,
  Layer,
  NavigationControl,
  Source,
  type MapRef,
  type MapLayerMouseEvent,
  type StyleSpecification,
} from "react-map-gl/maplibre";
import { loadStyle } from "app/maps/styleloader";
import type { Feature as GeoJsonFeature, Point } from "geojson";
import { StopSheet } from "~/components/StopSheet";
import { useTranslation } from "react-i18next";
import { REGIONS } from "~/data/RegionConfig";

// Default minimal fallback style before dynamic loading
const defaultStyle: StyleSpecification = {
  version: 8,
  glyphs: `${window.location.origin}/maps/fonts/{fontstack}/{range}.pbf`,
  sprite: `${window.location.origin}/maps/spritesheet/sprite`,
  sources: {},
  layers: [],
};

// Componente principal del mapa
export default function StopMap() {
  const { t } = useTranslation();
  const [stops, setStops] = useState<
    GeoJsonFeature<Point, { stopId: number; name: string; lines: string[] }>[]
  >([]);
  const [selectedStop, setSelectedStop] = useState<{
    stopId: number;
    name: string;
  } | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { mapState, updateMapState, theme, region } = useApp();
  const mapRef = useRef<MapRef>(null);
  const [mapStyleKey, setMapStyleKey] = useState<string>("light");

  // Style state for Map component
  const [mapStyle, setMapStyle] = useState<StyleSpecification>(defaultStyle);

  // Handle click events on clusters and individual stops
  const onMapClick = (e: MapLayerMouseEvent) => {
    const features = e.features;
    if (!features || features.length === 0) return;
    const feature = features[0];
    const props: any = feature.properties;

    handlePointClick(feature);
  };

  useEffect(() => {
    StopDataProvider.getStops(region).then((data) => {
      const features: GeoJsonFeature<
        Point,
        { stopId: number; name: string; lines: string[] }
      >[] = data.map((s) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [s.longitude as number, s.latitude as number],
        },
        properties: { stopId: s.stopId, name: s.name.original, lines: s.lines },
      }));
      setStops(features);
    });
  }, [region]);

  useEffect(() => {
    //const styleName = "carto";
    const styleName = "openfreemap";
    loadStyle(styleName, theme)
      .then((style) => setMapStyle(style))
      .catch((error) => console.error("Failed to load map style:", error));
  }, [mapStyleKey, theme]);

  useEffect(() => {
    const handleMapChange = () => {
      if (!mapRef.current) return;
      const map = mapRef.current.getMap();
      if (!map) return;
      const center = map.getCenter();
      const zoom = map.getZoom();
      updateMapState([center.lat, center.lng], zoom);
    };

    if (mapRef.current) {
      const map = mapRef.current.getMap();
      if (map) {
        map.on("moveend", handleMapChange);
      }
    }

    return () => {
      if (mapRef.current) {
        const map = mapRef.current.getMap();
        if (map) {
          map.off("moveend", handleMapChange);
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
    // fetch full stop to get lines array
    StopDataProvider.getStopById(region, props.stopId).then((stop) => {
      if (!stop) return;
      setSelectedStop({
        stopId: stop.stopId,
        name: stop.name.original,
      });
      setIsSheetOpen(true);
    });
  };

  return (
    <Map
      mapStyle={mapStyle}
      style={{ width: "100%", height: "100%" }}
      interactiveLayerIds={["stops"]}
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
      attributionControl={false}
      maxBounds={REGIONS[region].bounds ? [
        REGIONS[region].bounds!.sw,
        REGIONS[region].bounds!.ne,
      ] : undefined}
    >
      <NavigationControl position="top-right" />
      <GeolocateControl position="top-right" trackUserLocation={true} />
      <AttributionControl position="bottom-right" compact={false} />

      <Source
        id="stops-source"
        type="geojson"
        data={{ type: "FeatureCollection", features: stops }}
      />

      <Layer
        id="stops"
        type="symbol"
        source="stops-source"
        layout={{
          "icon-image": `stop-${region}`,
          "icon-size": ["interpolate", ["linear"], ["zoom"], 11, 0.7, 18, 1.0],
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
          "text-size": ["interpolate", ["linear"], ["zoom"], 11, 8, 22, 16]
        }}
        paint={{
          "text-color": `${REGIONS[region].textColour || "#000"}`,
          "text-halo-color": "#FFF",
          "text-halo-width": 1
        }}
      />


      {selectedStop && (
        <StopSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          stopId={selectedStop.stopId}
          stopName={selectedStop.name}
        />
      )}
    </Map>
  );
}
