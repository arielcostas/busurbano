export type RegionId = "vigo" | "santiago";

export interface RegionConfig {
  id: RegionId;
  name: string;
  stopsEndpoint: string;
  estimatesEndpoint: string;
  consolidatedCirculationsEndpoint: string | null;
  timetableEndpoint: string | null;
  defaultCenter: [number, number]; // [lat, lng]
  bounds?: {
    sw: [number, number];
    ne: [number, number];
  };
  textColour?: string;
  defaultZoom: number;
  showMeters: boolean; // Whether to show distance in meters
}

export const REGIONS: Record<RegionId, RegionConfig> = {
  vigo: {
    id: "vigo",
    name: "Vigo",
    stopsEndpoint: "/stops/vigo.json",
    estimatesEndpoint: "/api/vigo/GetStopEstimates",
    consolidatedCirculationsEndpoint: "/api/vigo/GetConsolidatedCirculations",
    timetableEndpoint: "/api/vigo/GetStopTimetable",
    defaultCenter: [42.229188855975046, -8.72246955783102],
    bounds: {
      sw: [-8.951059, 42.098923],
      ne: [-8.447748, 42.3496],
    },
    textColour: "#e72b37",
    defaultZoom: 14,
    showMeters: true,
  },
  santiago: {
    id: "santiago",
    name: "Santiago de Compostela",
    stopsEndpoint: "/stops/santiago.json",
    estimatesEndpoint: "/api/santiago/GetStopEstimates",
    consolidatedCirculationsEndpoint: null, // Not available for Santiago
    timetableEndpoint: null, // Not available for Santiago
    defaultCenter: [42.8782, -8.5448],
    bounds: {
      sw: [-8.884454, 42.719102],
      ne: [-8.243814, 43.02205],
    },
    textColour: "#6bb238",
    defaultZoom: 14,
    showMeters: false, // Santiago doesn't provide distance data
  },
};

export const DEFAULT_REGION: RegionId = "vigo";

export function getRegionConfig(regionId: RegionId): RegionConfig {
  return REGIONS[regionId];
}

export function getAvailableRegions(): RegionConfig[] {
  return Object.values(REGIONS);
}

export function isValidRegion(regionId: string): regionId is RegionId {
  return regionId === "vigo" || regionId === "santiago";
}
