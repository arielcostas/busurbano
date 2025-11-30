import { REGION_DATA } from "~/config/RegionConfig";

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
  amenities?: string[];

  title?: string;
  message?: string;
  alert?: "info" | "warning" | "error";
  cancelled?: boolean;
}

// In-memory cache and lookup map per region
const cachedStopsByRegion: Record<string, Stop[] | null> = {};
const stopsMapByRegion: Record<string, Record<number, Stop>> = {};
// Custom names loaded from localStorage per region
const customNamesByRegion: Record<string, Record<number, string>> = {};

// Initialize cachedStops and customNames once per region
async function initStops() {
  if (!cachedStopsByRegion[REGION_DATA.id]) {
    const response = await fetch(REGION_DATA.stopsEndpoint);
    const stops = (await response.json()) as Stop[];
    // build array and map
    stopsMapByRegion[REGION_DATA.id] = {};
    cachedStopsByRegion[REGION_DATA.id] = stops.map((stop) => {
      const entry = { ...stop, favourite: false } as Stop;
      stopsMapByRegion[REGION_DATA.id][stop.stopId] = entry;
      return entry;
    });
    // load custom names
    const rawCustom = localStorage.getItem(`customStopNames_${REGION_DATA.id}`);
    if (rawCustom) {
      customNamesByRegion[REGION_DATA.id] = JSON.parse(rawCustom) as Record<
        number,
        string
      >;
    } else {
      customNamesByRegion[REGION_DATA.id] = {};
    }
  }
}

async function getStops(): Promise<Stop[]> {
  await initStops();
  // update favourites
  const rawFav = localStorage.getItem("favouriteStops_vigo");
  const favouriteStops = rawFav ? (JSON.parse(rawFav) as number[]) : [];
  cachedStopsByRegion["vigo"]!.forEach(
    (stop) => (stop.favourite = favouriteStops.includes(stop.stopId))
  );
  return cachedStopsByRegion["vigo"]!;
}

// New: get single stop by id
async function getStopById(
  stopId: number
): Promise<Stop | undefined> {
  await initStops();
  const stop = stopsMapByRegion[REGION_DATA.id]?.[stopId];
  if (stop) {
    const rawFav = localStorage.getItem(`favouriteStops_${REGION_DATA.id}`);
    const favouriteStops = rawFav ? (JSON.parse(rawFav) as number[]) : [];
    stop.favourite = favouriteStops.includes(stopId);
  }
  return stop;
}

// Updated display name to include custom names
function getDisplayName(stop: Stop): string {
  const customNames = customNamesByRegion[REGION_DATA.id] || {};
  if (customNames[stop.stopId]) return customNames[stop.stopId];
  const nameObj = stop.name;
  return nameObj.intersect || nameObj.original;
}

// New: set or remove custom names
function setCustomName(stopId: number, label: string) {
  if (!customNamesByRegion[REGION_DATA.id]) {
    customNamesByRegion[REGION_DATA.id] = {};
  }
  customNamesByRegion[REGION_DATA.id][stopId] = label;
  localStorage.setItem(
    `customStopNames_${REGION_DATA.id}`,
    JSON.stringify(customNamesByRegion[REGION_DATA.id])
  );
}

function removeCustomName(stopId: number) {
  if (customNamesByRegion[REGION_DATA.id]?.[stopId]) {
    delete customNamesByRegion[REGION_DATA.id][stopId];
    localStorage.setItem(
      `customStopNames_${REGION_DATA.id}`,
      JSON.stringify(customNamesByRegion[REGION_DATA.id])
    );
  }
}

// New: get custom label for a stop
function getCustomName(stopId: number): string | undefined {
  return customNamesByRegion[REGION_DATA.id]?.[stopId];
}

function addFavourite(stopId: number) {
  const rawFavouriteStops = localStorage.getItem(`favouriteStops_vigo`);
  let favouriteStops: number[] = [];
  if (rawFavouriteStops) {
    favouriteStops = JSON.parse(rawFavouriteStops) as number[];
  }

  if (!favouriteStops.includes(stopId)) {
    favouriteStops.push(stopId);
    localStorage.setItem(
      `favouriteStops_vigo`,
      JSON.stringify(favouriteStops)
    );
  }
}

function removeFavourite(stopId: number) {
  const rawFavouriteStops = localStorage.getItem(`favouriteStops_vigo`);
  let favouriteStops: number[] = [];
  if (rawFavouriteStops) {
    favouriteStops = JSON.parse(rawFavouriteStops) as number[];
  }

  const newFavouriteStops = favouriteStops.filter((id) => id !== stopId);
  localStorage.setItem(
    `favouriteStops_vigo`,
    JSON.stringify(newFavouriteStops)
  );
}

function isFavourite(stopId: number): boolean {
  const rawFavouriteStops = localStorage.getItem(`favouriteStops_vigo`);
  if (rawFavouriteStops) {
    const favouriteStops = JSON.parse(rawFavouriteStops) as number[];
    return favouriteStops.includes(stopId);
  }
  return false;
}

const RECENT_STOPS_LIMIT = 10;

function pushRecent(stopId: number) {
  const rawRecentStops = localStorage.getItem(`recentStops_vigo`);
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
    `recentStops_vigo`,
    JSON.stringify(Array.from(recentStops))
  );
}

function getRecent(): number[] {
  const rawRecentStops = localStorage.getItem(`recentStops_vigo`);
  if (rawRecentStops) {
    return JSON.parse(rawRecentStops) as number[];
  }
  return [];
}

function getFavouriteIds(): number[] {
  const rawFavouriteStops = localStorage.getItem(`favouriteStops_vigo`);
  if (rawFavouriteStops) {
    return JSON.parse(rawFavouriteStops) as number[];
  }
  return [];
}

// New function to load stops from network
async function loadStopsFromNetwork(): Promise<Stop[]> {
  const response = await fetch(REGION_DATA.stopsEndpoint);
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
