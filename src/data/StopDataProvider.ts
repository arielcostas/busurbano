import stops from './stops.json';

export interface CachedStopList {
	timestamp: number;
	data: Stop[];
}

export interface Stop {
	stopId: number
	name: string;
	latitude?: number;
	longitude?: number;
	lines: string[];
	favourite?: boolean;
}

export class StopDataProvider {
	async getStops(): Promise<Stop[]> {
		const rawFavouriteStops = localStorage.getItem('favouriteStops');
		let favouriteStops: number[] = [];
		if (rawFavouriteStops) {
			favouriteStops = JSON.parse(rawFavouriteStops) as number[];
		}

		return stops.map((stop: Stop) => {
			return {
				...stop,
				favourite: favouriteStops.includes(stop.stopId)
			};
		});	
	}

	addFavourite(stopId: number) {
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

	removeFavourite(stopId: number) {
		const rawFavouriteStops = localStorage.getItem('favouriteStops');
		let favouriteStops: number[] = [];
		if (rawFavouriteStops) {
			favouriteStops = JSON.parse(rawFavouriteStops) as number[];
		}

		const newFavouriteStops = favouriteStops.filter(id => id !== stopId);
		localStorage.setItem('favouriteStops', JSON.stringify(newFavouriteStops));
	}

	isFavourite(stopId: number): boolean {
		const rawFavouriteStops = localStorage.getItem('favouriteStops');
		if (rawFavouriteStops) {
			const favouriteStops = JSON.parse(rawFavouriteStops) as number[];
			return favouriteStops.includes(stopId);
		}
		return false;
	}
}