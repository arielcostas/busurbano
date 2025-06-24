import { type JSX, useEffect, useState } from "react";
import { useParams } from "react-router";
import StopDataProvider from "../data/StopDataProvider";
import { Star, Edit2 } from 'lucide-react';
import "./estimates-$id.css";
import { RegularTable } from "../components/RegularTable";
import { useApp } from "../AppContext";
import { GroupedTable } from "../components/GroupedTable";
import { useTranslation } from "react-i18next";

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
	const resp = await fetch(`/api/GetStopEstimates?id=${stopId}`, {
		headers: {
			'Accept': 'application/json',
		}
	});
	return await resp.json();
};

export default function Estimates() {
	const { t } = useTranslation();
	const params = useParams();
	const stopIdNum = parseInt(params.id ?? "");
	const [customName, setCustomName] = useState<string | undefined>(undefined);
	const [data, setData] = useState<StopDetails | null>(null);
	const [dataDate, setDataDate] = useState<Date | null>(null);
	const [favourited, setFavourited] = useState(false);
	const { tableStyle } = useApp();

	useEffect(() => {
		loadData(params.id!)
			.then((body: StopDetails) => {
				setData(body);
				setDataDate(new Date());
				setCustomName(StopDataProvider.getCustomName(stopIdNum));
			})


		StopDataProvider.pushRecent(parseInt(params.id ?? ""));

		setFavourited(
			StopDataProvider.isFavourite(parseInt(params.id ?? ""))
		);
	}, [params.id]);


	const toggleFavourite = () => {
		if (favourited) {
			StopDataProvider.removeFavourite(stopIdNum);
			setFavourited(false);
		} else {
			StopDataProvider.addFavourite(stopIdNum);
			setFavourited(true);
		}
	}

	const handleRename = () => {
		const current = customName ?? data?.stop.name;
		const input = window.prompt('Custom name for this stop:', current);
		if (input === null) return; // cancelled
		const trimmed = input.trim();
		if (trimmed === '') {
			StopDataProvider.removeCustomName(stopIdNum);
			setCustomName(undefined);
		} else {
			StopDataProvider.setCustomName(stopIdNum, trimmed);
			setCustomName(trimmed);
		}
	};

	if (data === null) return <h1 className="page-title">Cargando datos en tiempo real...</h1>

	return (
		<div className="page-container">
			<div className="estimates-header">
				<h1 className="page-title">
					<Star className={`star-icon ${favourited ? 'active' : ''}`} onClick={toggleFavourite} />
					<Edit2 className="edit-icon" onClick={handleRename} />
					{(customName ?? data.stop.name)} <span className="estimates-stop-id">({data.stop.id})</span>
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
