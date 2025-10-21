export type RegionId = "vigo" | "santiago";

export interface RegionConfig {
  id: RegionId;
  name: string;
  stopsEndpoint: string;
  estimatesEndpoint: string;
  timetableEndpoint: string | null;
  defaultCenter: [number, number]; // [lat, lng]
  defaultZoom: number;
  showMeters: boolean; // Whether to show distance in meters
}

export const REGIONS: Record<RegionId, RegionConfig> = {
  vigo: {
    id: "vigo",
    name: "Vigo",
    stopsEndpoint: "/stops/vigo.json",
    estimatesEndpoint: "/api/vigo/GetStopEstimates",
    timetableEndpoint: "/api/vigo/GetStopTimetable",
    defaultCenter: [42.229188855975046, -8.72246955783102],
    defaultZoom: 14,
    showMeters: true,
  },
  santiago: {
    id: "santiago",
    name: "Santiago de Compostela",
    stopsEndpoint: "/stops/santiago.json",
    estimatesEndpoint: "/api/santiago/GetStopEstimates",
    timetableEndpoint: null, // Not available for Santiago
    defaultCenter: [42.8782, -8.5448],
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
