import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Stop, StopDataProvider } from "../data/stopDataProvider";

const sdp = new StopDataProvider();

export function Home() {
	const [data, setData] = useState<Stop[] | null>(null)
	const navigate = useNavigate();

	useEffect(() => {
		sdp.getStops().then((stops: Stop[]) => setData(stops))
	}, []);

	const handleStopSearch = async (event: React.FormEvent) => {
		event.preventDefault()

		const stopId = (event.target as HTMLFormElement).stopId.value
		const searchNumber = parseInt(stopId)
		if (data?.find(stop => stop.stopId === searchNumber)) {
			navigate(`/${searchNumber}`)
		} else {
			alert("Parada no encontrada")
		}
	}

	const favouritedStops = useMemo(() => {
		return data?.filter(stop => stop.favourite) ?? []
	}, [data])

	if (data === null) return <h1>Loading...</h1>

	return (
		<>
			<h1>UrbanoVigo Web</h1>

			<form action="none" onSubmit={handleStopSearch}>
				<div>
					<label htmlFor="stopId">
						ID
					</label>
					<input type="number" placeholder="ID de parada" id="stopId" />
				</div>

				<button type="submit">Buscar</button>
			</form>

			<h2>Paradas favoritas</h2>

			{favouritedStops?.length == 1 && (
				<p>
					Accede a una parada y márcala como favorita para verla aquí.
				</p>
			)}

			<ul>
				{favouritedStops?.sort((a, b) => a.stopId - b.stopId).map((stop: Stop) => (
					<li key={stop.stopId}>
						<Link to={`/${stop.stopId}`}>
							({stop.stopId}) {stop.name} - {stop.lines?.join(', ')}
						</Link>
					</li>
				))}
			</ul>

			<h2>Paradas</h2>

			<ul>
				{data?.sort((a, b) => a.stopId - b.stopId).map((stop: Stop) => (
					<li key={stop.stopId}>
						<Link to={`/${stop.stopId}`}>
							({stop.stopId}) {stop.name} - {stop.lines?.join(', ')}
						</Link>
					</li>
				))}
			</ul>
		</>
	)
}
