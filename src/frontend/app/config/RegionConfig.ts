export type RegionId = "vigo";

export interface RegionConfig {
  id: RegionId;
  name: string;
  stopsEndpoint: string;
  estimatesEndpoint: string;
  consolidatedCirculationsEndpoint: string | null;
  timetableEndpoint: string | null;
  shapeEndpoint: string | null;
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
    shapeEndpoint: "/api/vigo/GetShape",
    defaultCenter: [42.229188855975046, -8.72246955783102],
    bounds: {
      sw: [-8.951059, 42.098923],
      ne: [-8.447748, 42.3496],
    },
    textColour: "#e72b37",
    defaultZoom: 14,
    showMeters: true,
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
  return regionId === "vigo";
}
