import { useNavigate } from "react-router-dom";
import useSWR from "swr";

interface Stop {
	stopId: number
	name: string;
	latitude?: number;
	longitude?: number;
	lines: string[];
}

interface CachedStopList {
	timetsamp: number;
	data: Stop[];
}

export function Home() {
	const navigate = useNavigate()
	const { data, error, isLoading } = useSWR<Stop[]>('home', async () => {
		const cachedData = localStorage.getItem('cachedStopList')
		if (cachedData) {
			const parsedData: CachedStopList = JSON.parse(cachedData)

			// Cache for 12 hours
			if (Date.now() - parsedData.timetsamp < 1000 * 60 * 60 * 12) {
				console.log("parsed data: ", parsedData.data)
				return parsedData.data
			} else {
				localStorage.removeItem('cachedStopList')
			}
		}

		const response = await fetch('/api/ListStops')
		const body = await response.json();

		localStorage.setItem('cachedStopList', JSON.stringify({
			timestamp: Date.now(),
			data: body
		}));
		
		return body;
	});

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

	if (isLoading) return <h1>Loading...</h1>
	if (error) return <h1>Error</h1>

	return (
		<>
			<h1>Home</h1>

			<form action="none" onSubmit={handleStopSearch}>
				<div>
					<label htmlFor="stopId">
						ID
					</label>
					<input type="number" placeholder="ID de parada" id="stopId" />
				</div>

				<button type="submit">Buscar</button>
			</form>

			<ul>
				{data?.sort((a, b) => a.stopId - b.stopId).map((stop: Stop) => (
					<li key={stop.stopId}>
						<a href={`/${stop.stopId}`}>
							({stop.stopId}) {stop.name} - {stop.lines?.join(', ')}
						</a>
					</li>
				))}
			</ul>
		</>
	)
}
