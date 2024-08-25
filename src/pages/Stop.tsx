import { useParams } from "react-router-dom";
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

	const { data, error, isLoading } = useSWR<StopDetails>('home', async () => {
		let response;

		try {
			response = await fetch(`/api/GetStopEstimates?id=${params.stopId}`)
			return response.json()
		} catch (error) {
			console.error(error)
			throw new Error(`Failed to fetch data, status ${response!.status}, body: ${await response!.text()}`)
		}
	});

	if (isLoading) return <h1>Loading...</h1>
	if (error) return <h1>Error: {JSON.stringify(error)}</h1>
	if (data === undefined) return <h1>No data</h1>

	return (
		<>
			<h1>{data?.stop.name} ({data?.stop.id})</h1>

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
								<td>{estimate.minutes}</td>
								<td>{estimate.meters}</td>
							</tr>
						))}
				</tbody>
			</table>
		</>
	)
}
