import { Link, useParams } from "react-router-dom";
import useSWR from "swr";

interface StopDetails {
	stop: {
		id: number;
		name: string;
		latitude: number;
		longitude: number;
	}
	estimates: [{
		line: string;
		route: string;
		minutes: number;
		meters: number;
	}]
}

export function Stop(): JSX.Element {
	const params = useParams();

	const { data, error, isLoading } = useSWR<StopDetails>(`stop-${params.stopId}`, async () => {
		let response;

		try {
			response = await fetch(`/api/GetStopEstimates?id=${params.stopId}`)
			return response.json()
		} catch (error) {
			console.error(error)
			throw new Error(`Failed to fetch data, status ${response!.status}, body: ${await response!.text()}`)
		}
	});

	const absoluteArrivalTime = (minutes: number) => {
		const now = new Date()
		const arrival = new Date(now.getTime() + minutes * 60000)
		return Intl.DateTimeFormat(navigator.language, {
			hour: '2-digit',
			minute: '2-digit'
		}).format(arrival)
	}

	if (isLoading) return <h1>Loading...</h1>
	if (error) return <h1>Error: {JSON.stringify(error)}</h1>
	if (data === undefined) return <h1>No data</h1>

	return (
		<>
			<div>
				<h1>{data?.stop.name} ({data?.stop.id})</h1>
			</div>

			<Link to="/">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					style={{marginInlineEnd: '0.5em', width: '1em', height: '1em'}}
				>
					<path d="M19 12H5M12 19l-7-7 7-7" />
				</svg>
				Volver al listado de paradas
			</Link>

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
			</table>

			<p>
				<Link to="/">Volver al inicio</Link>
			</p>
		</>
	)
}
