export interface CachedStopList {
	timestamp: number;
	data: Stop[];
}

export type StopName = {
	original: string;
	intersect?: string;
}

export interface Stop {
	stopId: number;
	name: StopName;
	latitude?: number;
	longitude?: number;
	lines: string[];
	favourite?: boolean;
}

// In-memory cache and lookup map
let cachedStops: Stop[] | null = null;
let stopsMap: Record<number, Stop> = {};
// Custom names loaded from localStorage
let customNames: Record<number, string> = {};

// Initialize cachedStops and customNames once
async function initStops() {
    if (!cachedStops) {
        const response = await fetch('/stops.json');
        const stops = await response.json() as Stop[];
        // build array and map
        stopsMap = {};
        cachedStops = stops.map(stop => {
            const entry = { ...stop, favourite: false } as Stop;
            stopsMap[stop.stopId] = entry;
            return entry;
        });
        // load custom names
        const rawCustom = localStorage.getItem('customStopNames');
        if (rawCustom) customNames = JSON.parse(rawCustom) as Record<number, string>;
    }
}

async function getStops(): Promise<Stop[]> {
    await initStops();
    // update favourites
    const rawFav = localStorage.getItem('favouriteStops');
    const favouriteStops = rawFav ? JSON.parse(rawFav) as number[] : [];
    cachedStops!.forEach(stop => stop.favourite = favouriteStops.includes(stop.stopId));
    return cachedStops!;
}

// New: get single stop by id
async function getStopById(stopId: number): Promise<Stop | undefined> {
    await initStops();
    const stop = stopsMap[stopId];
    if (stop) {
        const rawFav = localStorage.getItem('favouriteStops');
        const favouriteStops = rawFav ? JSON.parse(rawFav) as number[] : [];
        stop.favourite = favouriteStops.includes(stopId);
    }
    return stop;
}

// Updated display name to include custom names
function getDisplayName(stop: Stop): string {
    if (customNames[stop.stopId]) return customNames[stop.stopId];
    const nameObj = stop.name;
	return nameObj.intersect || nameObj.original;
}

// New: set or remove custom names
function setCustomName(stopId: number, label: string) {
    customNames[stopId] = label;
    localStorage.setItem('customStopNames', JSON.stringify(customNames));
}

function removeCustomName(stopId: number) {
    delete customNames[stopId];
    localStorage.setItem('customStopNames', JSON.stringify(customNames));
}

// New: get custom label for a stop
function getCustomName(stopId: number): string | undefined {
    return customNames[stopId];
}

function addFavourite(stopId: number) {
	const rawFavouriteStops = localStorage.getItem('favouriteStops');
	let favouriteStops: number[] = [];
	if (rawFavouriteStops) {
		favouriteStops = JSON.parse(rawFavouriteStops) as number[];
	}

	if (!favouriteStops.includes(stopId)) {
		favouriteStops.push(stopId);
		localStorage.setItem('favouriteStops', JSON.stringify(favouriteStops));
	}
}

function removeFavourite(stopId: number) {
	const rawFavouriteStops = localStorage.getItem('favouriteStops');
	let favouriteStops: number[] = [];
	if (rawFavouriteStops) {
		favouriteStops = JSON.parse(rawFavouriteStops) as number[];
	}

	const newFavouriteStops = favouriteStops.filter(id => id !== stopId);
	localStorage.setItem('favouriteStops', JSON.stringify(newFavouriteStops));
}

function isFavourite(stopId: number): boolean {
	const rawFavouriteStops = localStorage.getItem('favouriteStops');
	if (rawFavouriteStops) {
		const favouriteStops = JSON.parse(rawFavouriteStops) as number[];
		return favouriteStops.includes(stopId);
	}
	return false;
}

const RECENT_STOPS_LIMIT = 10;

function pushRecent(stopId: number) {
	const rawRecentStops = localStorage.getItem('recentStops');
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

	localStorage.setItem('recentStops', JSON.stringify(Array.from(recentStops)));
}

function getRecent(): number[] {
	const rawRecentStops = localStorage.getItem('recentStops');
	if (rawRecentStops) {
		return JSON.parse(rawRecentStops) as number[];
	}
	return [];
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
    getRecent
};
