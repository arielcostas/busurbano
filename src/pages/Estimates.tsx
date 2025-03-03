import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { StopDataProvider } from "../data/StopDataProvider";
import LineIcon from "../components/LineIcon";
import { Star } from 'lucide-react';
import "../styles/Estimates.css";

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

export function Estimates(): JSX.Element {
	const sdp = new StopDataProvider();
	const [data, setData] = useState<StopDetails | null>(null);
	const [dataDate, setDataDate] = useState<Date | null>(null);
	const [favourited, setFavourited] = useState(false);
	const params = useParams();

	const loadData = () => {
		fetch(`/api/GetStopEstimates?id=${params.stopId}`)
			.then(r => r.json())
			.then((body: StopDetails) => {
				setData(body);
				setDataDate(new Date());
			});
	};

	useEffect(() => {
		loadData();

		sdp.pushRecent(parseInt(params.stopId ?? ""));

		setFavourited(
			sdp.isFavourite(parseInt(params.stopId ?? ""))
		);
	}, []);

	const absoluteArrivalTime = (minutes: number) => {
		const now = new Date()
		const arrival = new Date(now.getTime() + minutes * 60000)
		return Intl.DateTimeFormat(navigator.language, {
			hour: '2-digit',
			minute: '2-digit'
		}).format(arrival)
	}

	const formatDistance = (meters: number) => {
		if (meters > 1024) {
			return `${(meters / 1000).toFixed(1)} km`;
		} else {
			return `${meters} m`;
		}
	}

	const toggleFavourite = () => {
		if (favourited) {
			sdp.removeFavourite(parseInt(params.stopId ?? ""));
			setFavourited(false);
		} else {
			sdp.addFavourite(parseInt(params.stopId ?? ""));
			setFavourited(true);
		}
	}

	if (data === null) return <h1 className="page-title">Cargando datos en tiempo real...</h1>

	return (
		<div className="page-container">
			<div className="estimates-header">
				<h1 className="page-title">
					<Star className={`star-icon ${favourited ? 'active' : ''}`} onClick={toggleFavourite} />
					{data?.stop.name} <span className="estimates-stop-id">({data?.stop.id})</span>
				</h1>
			</div>

			<div className="table-responsive">
				<table className="table">
					<caption>Estimaciones de llegadas a las {dataDate?.toLocaleTimeString()}</caption>

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
									<td><LineIcon line={estimate.line} /></td>
									<td>{estimate.route}</td>
									<td>
										{estimate.minutes > 15
											? absoluteArrivalTime(estimate.minutes)
											: `${estimate.minutes} min`}
									</td>
									<td>
										{estimate.meters > -1
											? formatDistance(estimate.meters)
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
			</div>
		</div>
	)
}
