import { JSX, useEffect, useState } from "react";
import { useParams } from "react-router";
import StopDataProvider from "../data/StopDataProvider";
import { Star } from 'lucide-react';
import "../styles/Estimates.css";
import { RegularTable } from "../components/RegularTable";
import { useApp } from "../AppContext";
import { GroupedTable } from "../components/GroupedTable";

export interface StopDetails {
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

const loadData = async (stopId: string) => {
	const resp = await fetch(`/api/GetStopEstimates?id=${stopId}`);
	return await resp.json();
};

export function Estimates(): JSX.Element {
	const [data, setData] = useState<StopDetails | null>(null);
	const [dataDate, setDataDate] = useState<Date | null>(null);
	const [favourited, setFavourited] = useState(false);
	const params = useParams();
	const { tableStyle } = useApp();

	useEffect(() => {
		loadData(params.stopId!)
			.then((body: StopDetails) => {
				setData(body);
				setDataDate(new Date());
			})


		StopDataProvider.pushRecent(parseInt(params.stopId ?? ""));

		setFavourited(
			StopDataProvider.isFavourite(parseInt(params.stopId ?? ""))
		);
	}, [params.stopId]);


	const toggleFavourite = () => {
		if (favourited) {
			StopDataProvider.removeFavourite(parseInt(params.stopId ?? ""));
			setFavourited(false);
		} else {
			StopDataProvider.addFavourite(parseInt(params.stopId ?? ""));
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
				{tableStyle === 'grouped' ?
					<GroupedTable data={data} dataDate={dataDate} /> :
					<RegularTable data={data} dataDate={dataDate} />}
			</div>
		</div>
	)
}
