import { useEffect, useMemo, useState } from "react";
import { Stop, StopDataProvider } from "../data/StopDataProvider";
import StopItem from "../components/StopItem";
import Fuse from "fuse.js";

const sdp = new StopDataProvider();

const placeholders = [
  "Urzaiz",
  "Gran Vía",
  "Castelao",
  "García Barbón",
  "Valladares",
  "Florida",
  "Pizarro",
  "Estrada Madrid",
  "Sanjurjo Badía"
];

export function StopList() {
	const [data, setData] = useState<Stop[] | null>(null)
	const [searchResults, setSearchResults] = useState<Stop[] | null>(null);

	useEffect(() => {
		sdp.getStops().then((stops: Stop[]) => setData(stops))
	}, []);

	const handleStopSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		const stopName = event.target.value;
		if (data) {
			const fuse = new Fuse(data, { keys: ['name'], threshold: 0.3 });
			const results = fuse.search(stopName).map(result => result.item);
			setSearchResults(results);
		}
	}

	const favouritedStops = useMemo(() => {
		return data?.filter(stop => stop.favourite) ?? []
	}, [data])

	const recentStops = useMemo(() => {
		const recent = sdp.getRecent();

		if (recent.length === 0) return null;
		
		return recent.map(stopId => data?.find(stop => stop.stopId === stopId) as Stop).reverse();
	}, [data])

	if (data === null) return <h1 className="page-title">Loading...</h1>

	const randomPlaceholder = placeholders[Math.floor(Math.random() * placeholders.length)];

	return (
		<div className="page-container">
			<h1 className="page-title">UrbanoVigo Web</h1>

			<form className="search-form">
				<div className="form-group">
					<label className="form-label" htmlFor="stopName">
						Buscar paradas
					</label>
					<input className="form-input" type="text" placeholder={randomPlaceholder} id="stopName" onChange={handleStopSearch} />
				</div>
			</form>

			{searchResults && searchResults.length > 0 && (
				<div className="list-container">
					<h2 className="page-subtitle">Resultados de la búsqueda</h2>
					<ul className="list">
						{searchResults.map((stop: Stop) => (
							<StopItem key={stop.stopId} stop={stop} />
						))}
					</ul>
				</div>
			)}

			<div className="list-container">
				<h2 className="page-subtitle">Paradas favoritas</h2>

				{favouritedStops?.length === 0 && (
					<p className="message">
						Accede a una parada y márcala como favorita para verla aquí.
					</p>
				)}

				<ul className="list">
					{favouritedStops?.sort((a, b) => a.stopId - b.stopId).map((stop: Stop) => (
						<StopItem key={stop.stopId} stop={stop} />
					))}
				</ul>
			</div>

			{recentStops && recentStops.length > 0 && (
				<div className="list-container">
					<h2 className="page-subtitle">Recientes</h2>

					<ul className="list">
						{recentStops.map((stop: Stop) => (
							<StopItem key={stop.stopId} stop={stop} />
						))}
					</ul>
				</div>
			)}

			<div className="list-container">
				<h2 className="page-subtitle">Paradas</h2>

				<ul className="list">
					{data?.sort((a, b) => a.stopId - b.stopId).map((stop: Stop) => (
						<StopItem key={stop.stopId} stop={stop} />
					))}
				</ul>
			</div>
		</div>
	)
}
