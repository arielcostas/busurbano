import type { LngLatLike } from "maplibre-gl";

export type RegionId = "vigo";

export interface RegionData {
  id: RegionId;
  name: string;
  stopsEndpoint: string;
  estimatesEndpoint: string;
  consolidatedCirculationsEndpoint: string;
  timetableEndpoint: string;
  shapeEndpoint: string;
  defaultCenter: LngLatLike;
  bounds: {
    sw: LngLatLike;
    ne: LngLatLike;
  };
  textColour: string;
  defaultZoom: number;
  showMeters: boolean;
}

export const REGION_DATA: RegionData = {
  id: "vigo",
  name: "Vigo",
  stopsEndpoint: "/stops/vigo.json",
  estimatesEndpoint: "/api/vigo/GetStopEstimates",
  consolidatedCirculationsEndpoint: "/api/vigo/GetConsolidatedCirculations",
  timetableEndpoint: "/api/vigo/GetStopTimetable",
  shapeEndpoint: "/api/vigo/GetShape",
  defaultCenter: [42.229188855975046, -8.72246955783102] as LngLatLike,
  bounds: {
    sw: [-8.951059, 42.098923] as LngLatLike,
    ne: [-8.447748, 42.3496] as LngLatLike,
  },
  textColour: "#e72b37",
  defaultZoom: 14,
  showMeters: true,
};

export const getAvailableRegions = (): RegionData[] => [REGION_DATA];
