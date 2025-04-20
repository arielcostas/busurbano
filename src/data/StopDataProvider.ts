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

export default {
	getStops,
	getDisplayName,
	addFavourite,
	removeFavourite,
	isFavourite,
	pushRecent,
	getRecent
};

async function getStops(): Promise<Stop[]> {
	const rawFavouriteStops = localStorage.getItem('favouriteStops');
	let favouriteStops: number[] = [];
	if (rawFavouriteStops) {
		favouriteStops = JSON.parse(rawFavouriteStops) as number[];
	}

	const response = await fetch('/stops.json');
	const stops = await response.json() as Stop[];

	return stops.map((stop: Stop) => {
		return {
			...stop,
			favourite: favouriteStops.includes(stop.stopId)
		};
	});
}

// Get display name based on preferences or context
function getDisplayName(stop: Stop): string {
	if (typeof stop.name === 'string') {
		return stop.name;
	}

	return stop.name.intersect || stop.name.original;
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
