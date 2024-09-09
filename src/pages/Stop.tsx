import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { StopDataProvider } from "../data/StopDataProvider";

interface StopDetails {
	stop: {
		id: number;
		name: string;
		latitude: number;
		longitude: number;
	}
	estimates: {
		line: string;
		route: string;
		minutes: number;
		meters: number;
	}[]
}

export function Stop(): JSX.Element {
	const sdp = new StopDataProvider();
	const [data, setData] = useState<StopDetails | null>(null);
	const [favourited, setFavourited] = useState(false);
	const params = useParams();

	const loadData = () => {
		fetch(`/api/GetStopEstimates?id=${params.stopId}`)
			.then(r => r.json())
			.then((body: StopDetails) => setData(body));
	};

	useEffect(() => {
		loadData();

		sdp.pushRecent(parseInt(params.stopId ?? ""));

		setFavourited(
			sdp.isFavourite(parseInt(params.stopId ?? ""))
		);
	})

	const absoluteArrivalTime = (minutes: number) => {
		const now = new Date()
		const arrival = new Date(now.getTime() + minutes * 60000)
		return Intl.DateTimeFormat(navigator.language, {
			hour: '2-digit',
			minute: '2-digit'
		}).format(arrival)
	}

	if (data === null) return <h1>Cargando datos en tiempo real...</h1>

	return (
		<>
			<div>
				<h1>{data?.stop.name} ({data?.stop.id})</h1>
			</div>

			<div style={{display: 'flex', gap: '1rem'}}>
				<Link to="/" className="button">
					🔙 Volver al listado de paradas
				</Link>

				{!favourited && (
					<button type="button" onClick={() => {
						sdp.addFavourite(parseInt(params.stopId ?? ""));
						setFavourited(true);
					}}>
						⭐ Añadir a favoritos
					</button>
				)}

				{favourited && (
					<button type="button" onClick={() => {
						sdp.removeFavourite(parseInt(params.stopId ?? ""));
						setFavourited(false);
					}}>
						⭐Quitar de favoritos
					</button>
				)}

				<button onClick={loadData}>⬇️ Recargar</button>
			</div>

			<table>
				<caption>Estimaciones de llegadas</caption>

				<thead>
					<tr>
						<th>Línea</th>
						<th>Ruta</th>
						<th>Minutos</th>
						<th>Metros</th>
					</tr>
				</thead>

				<tbody>
					{data.estimates
						.sort((a, b) => a.minutes - b.minutes)
						.map((estimate, idx) => (
							<tr key={idx}>
								<td>{estimate.line}</td>
								<td>{estimate.route}</td>
								<td>
									{estimate.minutes} ({absoluteArrivalTime(estimate.minutes)})
								</td>
								<td>
									{estimate.meters > -1
										? `${estimate.meters} metros`
										: "No disponible"
									}
								</td>
							</tr>
						))}
				</tbody>

				{data?.estimates.length === 0 && (
					<tfoot>
						<tr>
							<td colSpan={4}>No hay estimaciones disponibles</td>
						</tr>
					</tfoot>
				)}
			</table>

			<p>
				<Link to="/">Volver al inicio</Link>
			</p>
		</>
	)
}
