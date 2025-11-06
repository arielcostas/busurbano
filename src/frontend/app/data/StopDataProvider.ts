import { type RegionId, getRegionConfig } from "./RegionConfig";

export interface CachedStopList {
  timestamp: number;
  data: Stop[];
}

export type StopName = {
  original: string;
  intersect?: string;
};

export interface Stop {
  stopId: number;
  name: StopName;
  latitude?: number;
  longitude?: number;
  lines: string[];
  favourite?: boolean;
}

// In-memory cache and lookup map per region
const cachedStopsByRegion: Record<string, Stop[] | null> = {};
const stopsMapByRegion: Record<string, Record<number, Stop>> = {};
// Custom names loaded from localStorage per region
const customNamesByRegion: Record<string, Record<number, string>> = {};

// Initialize cachedStops and customNames once per region
async function initStops(region: RegionId) {
  if (!cachedStopsByRegion[region]) {
    const regionConfig = getRegionConfig(region);
    const response = await fetch(regionConfig.stopsEndpoint);
    const stops = (await response.json()) as Stop[];
    // build array and map
    stopsMapByRegion[region] = {};
    cachedStopsByRegion[region] = stops.map((stop) => {
      const entry = { ...stop, favourite: false } as Stop;
      stopsMapByRegion[region][stop.stopId] = entry;
      return entry;
    });
    // load custom names
    const rawCustom = localStorage.getItem(`customStopNames_${region}`);
    if (rawCustom) {
      customNamesByRegion[region] = JSON.parse(rawCustom) as Record<
        number,
        string
      >;
    } else {
      customNamesByRegion[region] = {};
    }
  }
}

async function getStops(region: RegionId): Promise<Stop[]> {
  await initStops(region);
  // update favourites
  const rawFav = localStorage.getItem(`favouriteStops_${region}`);
  const favouriteStops = rawFav ? (JSON.parse(rawFav) as number[]) : [];
  cachedStopsByRegion[region]!.forEach(
    (stop) => (stop.favourite = favouriteStops.includes(stop.stopId)),
  );
  return cachedStopsByRegion[region]!;
}

// New: get single stop by id
async function getStopById(
  region: RegionId,
  stopId: number,
): Promise<Stop | undefined> {
  await initStops(region);
  const stop = stopsMapByRegion[region]?.[stopId];
  if (stop) {
    const rawFav = localStorage.getItem(`favouriteStops_${region}`);
    const favouriteStops = rawFav ? (JSON.parse(rawFav) as number[]) : [];
    stop.favourite = favouriteStops.includes(stopId);
  }
  return stop;
}

// Updated display name to include custom names
function getDisplayName(region: RegionId, stop: Stop): string {
  const customNames = customNamesByRegion[region] || {};
  if (customNames[stop.stopId]) return customNames[stop.stopId];
  const nameObj = stop.name;
  return nameObj.intersect || nameObj.original;
}

// New: set or remove custom names
function setCustomName(region: RegionId, stopId: number, label: string) {
  if (!customNamesByRegion[region]) {
    customNamesByRegion[region] = {};
  }
  customNamesByRegion[region][stopId] = label;
  localStorage.setItem(
    `customStopNames_${region}`,
    JSON.stringify(customNamesByRegion[region]),
  );
}

function removeCustomName(region: RegionId, stopId: number) {
  if (customNamesByRegion[region]) {
    delete customNamesByRegion[region][stopId];
    localStorage.setItem(
      `customStopNames_${region}`,
      JSON.stringify(customNamesByRegion[region]),
    );
  }
}

// New: get custom label for a stop
function getCustomName(region: RegionId, stopId: number): string | undefined {
  return customNamesByRegion[region]?.[stopId];
}

function addFavourite(region: RegionId, stopId: number) {
  const rawFavouriteStops = localStorage.getItem(`favouriteStops_${region}`);
  let favouriteStops: number[] = [];
  if (rawFavouriteStops) {
    favouriteStops = JSON.parse(rawFavouriteStops) as number[];
  }

  if (!favouriteStops.includes(stopId)) {
    favouriteStops.push(stopId);
    localStorage.setItem(
      `favouriteStops_${region}`,
      JSON.stringify(favouriteStops),
    );
  }
}

function removeFavourite(region: RegionId, stopId: number) {
  const rawFavouriteStops = localStorage.getItem(`favouriteStops_${region}`);
  let favouriteStops: number[] = [];
  if (rawFavouriteStops) {
    favouriteStops = JSON.parse(rawFavouriteStops) as number[];
  }

  const newFavouriteStops = favouriteStops.filter((id) => id !== stopId);
  localStorage.setItem(
    `favouriteStops_${region}`,
    JSON.stringify(newFavouriteStops),
  );
}

function isFavourite(region: RegionId, stopId: number): boolean {
  const rawFavouriteStops = localStorage.getItem(`favouriteStops_${region}`);
  if (rawFavouriteStops) {
    const favouriteStops = JSON.parse(rawFavouriteStops) as number[];
    return favouriteStops.includes(stopId);
  }
  return false;
}

const RECENT_STOPS_LIMIT = 10;

function pushRecent(region: RegionId, stopId: number) {
  const rawRecentStops = localStorage.getItem(`recentStops_${region}`);
  let recentStops: Set<number> = new Set();
  if (rawRecentStops) {
    recentStops = new Set(JSON.parse(rawRecentStops) as number[]);
  }

  recentStops.add(stopId);
  if (recentStops.size > RECENT_STOPS_LIMIT) {
    const iterator = recentStops.values();
    const val = iterator.next().value as number;
    recentStops.delete(val);
  }

  localStorage.setItem(
    `recentStops_${region}`,
    JSON.stringify(Array.from(recentStops)),
  );
}

function getRecent(region: RegionId): number[] {
  const rawRecentStops = localStorage.getItem(`recentStops_${region}`);
  if (rawRecentStops) {
    return JSON.parse(rawRecentStops) as number[];
  }
  return [];
}

function getFavouriteIds(region: RegionId): number[] {
  const rawFavouriteStops = localStorage.getItem(`favouriteStops_${region}`);
  if (rawFavouriteStops) {
    return JSON.parse(rawFavouriteStops) as number[];
  }
  return [];
}

// New function to load stops from network
async function loadStopsFromNetwork(region: RegionId): Promise<Stop[]> {
  const regionConfig = getRegionConfig(region);
  const response = await fetch(regionConfig.stopsEndpoint);
  const stops = (await response.json()) as Stop[];
  return stops.map((stop) => ({ ...stop, favourite: false }) as Stop);
}

export default {
  getStops,
  getStopById,
  getCustomName,
  getDisplayName,
  setCustomName,
  removeCustomName,
  addFavourite,
  removeFavourite,
  isFavourite,
  pushRecent,
  getRecent,
  getFavouriteIds,
  loadStopsFromNetwork,
};
