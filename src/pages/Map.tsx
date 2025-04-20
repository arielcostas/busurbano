import StopDataProvider, { Stop } from "../data/StopDataProvider";

import 'leaflet/dist/leaflet.css'
import 'react-leaflet-markercluster/styles'

import { useEffect, useState } from 'react';
import LineIcon from '../components/LineIcon';
import { Link } from 'react-router';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { Icon, LatLngTuple } from "leaflet";
import { EnhancedLocateControl } from "../controls/LocateControl";
import { useApp } from "../AppContext";

const icon = new Icon({
	iconUrl: '/map-pin-icon.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41]
});

// Componente auxiliar para detectar cambios en el mapa
const MapEventHandler = () => {
	const { updateMapState } = useApp();
	
	const map = useMapEvents({
		moveend: () => {
			const center = map.getCenter();
			const zoom = map.getZoom();
			updateMapState([center.lat, center.lng], zoom);
		}
	});
	
	return null;
};

// Componente principal del mapa
export function StopMap() {
	const [stops, setStops] = useState<Stop[]>([]);
	const { mapState } = useApp();

	useEffect(() => {
		StopDataProvider.getStops().then(setStops);
	}, []);

	return (
		<MapContainer 
			center={mapState.center} 
			zoom={mapState.zoom} 
			scrollWheelZoom={true} 
			style={{ height: '100%' }}
		>
			<TileLayer
				attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>'
				url="https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png"
			/>
				<EnhancedLocateControl />
				<MapEventHandler />
			<MarkerClusterGroup>
				{stops.map(stop => (
					<Marker key={stop.stopId} position={[stop.latitude, stop.longitude] as LatLngTuple} icon={icon}>
						<Popup>
							<Link to={`/estimates/${stop.stopId}`}>{StopDataProvider.getDisplayName(stop)}</Link>
							<br />
							{stop.lines.map((line) => (
								<LineIcon key={line} line={line} />
							))}
						</Popup>
					</Marker>
				))}
			</MarkerClusterGroup>
		</MapContainer>
	);
}
