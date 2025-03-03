import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Stop, StopDataProvider } from "../data/StopDataProvider";
import LineIcon from "../components/LineIcon";

const sdp = new StopDataProvider();

export function StopMap() {
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
			navigate(`/estimates/${searchNumber}`)
		} else {
			alert("Parada no encontrada")
		}
	}

	if (data === null) return <h1 className="page-title">Loading...</h1>

	return (
		<div className="page-container">
			<h1 className="page-title">Map View</h1>

			<div className="map-container">
				{/* Map placeholder - in a real implementation, this would be a map component */}
				<div style={{
					height: '100%',
					backgroundColor: '#f0f0f0',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					borderRadius: '8px'
				}}>
					<p>Map will be displayed here</p>
				</div>
			</div>

			<form className="search-form" onSubmit={handleStopSearch}>
				<div className="form-group">
					<label className="form-label" htmlFor="stopId">
						Find Stop by ID
					</label>
					<input className="form-input" type="number" placeholder="Stop ID" id="stopId" />
				</div>

				<button className="form-button" type="submit">Search</button>
			</form>

			<div className="list-container">
				<h2 className="page-subtitle">Nearby Stops</h2>
				<ul className="list">
					{data?.slice(0, 5).map((stop: Stop) => (
						<li className="list-item" key={stop.stopId}>
							<Link className="list-item-link" to={`/estimates/${stop.stopId}`}>
								({stop.stopId}) {stop.name}
								<div className="line-icons">
									{stop.lines?.map(line => <LineIcon key={line} line={line} />)}
								</div>
							</Link>
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}
