import useSWR from "swr";

interface Stop {
	stopId: number
	name: string;
	latitude?: number;
	longitude?: number;
	lines: string[];
}

export function Home() {
	const { data, error, isLoading } = useSWR<Stop[]>('home', async () => {
		const response = await fetch('/api/ListStops')
		return response.json()
	});

	if (isLoading) return <h1>Loading...</h1>
	if (error) return <h1>Error</h1>

	return (
		<>
			<h1>Home</h1>

			<ul>
				{data?.map((stop: Stop) => (
					<li key={stop.stopId}>
						{stop.name} - {stop.lines?.join(', ')}
					</li>
				))}
			</ul>
		</>
	)
}
