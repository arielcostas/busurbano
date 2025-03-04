import { StopDetails } from "../pages/Estimates";
import LineIcon from "./LineIcon";

interface GroupedTable {
    data: StopDetails;
    dataDate: Date | null;
}

export const GroupedTable: React.FC<GroupedTable> = ({ data, dataDate }) => {
    const formatDistance = (meters: number) => {
        if (meters > 1024) {
            return `${(meters / 1000).toFixed(1)} km`;
        } else {
            return `${meters} m`;
        }
    }

    const groupedEstimates = data.estimates.reduce((acc, estimate) => {
        if (!acc[estimate.line]) {
            acc[estimate.line] = [];
        }
        acc[estimate.line].push(estimate);
        return acc;
    }, {} as Record<string, typeof data.estimates>);

    const sortedLines = Object.keys(groupedEstimates).sort((a, b) => {
        const firstArrivalA = groupedEstimates[a][0].minutes;
        const firstArrivalB = groupedEstimates[b][0].minutes;
        return firstArrivalA - firstArrivalB;
    });

    return <table className="table">
        <caption>Estimaciones de llegadas a las {dataDate?.toLocaleTimeString()}</caption>

        <thead>
            <tr>
                <th>Línea</th>
                <th>Ruta</th>
                <th>Llegada</th>
                <th>Distancia</th>
            </tr>
        </thead>

        <tbody>
            {sortedLines.map((line) => (
                groupedEstimates[line].map((estimate, idx) => (
                    <tr key={`${line}-${idx}`}>
                        {idx === 0 && (
                            <td rowSpan={groupedEstimates[line].length} style={{ verticalAlign: 'top' }}>
                                <LineIcon line={line} />
                            </td>
                        )}
                        <td>{estimate.route}</td>
                        <td>{`${estimate.minutes} min`}</td>
                        <td>
                            {estimate.meters > -1
                                ? formatDistance(estimate.meters)
                                : "No disponible"
                            }
                        </td>
                    </tr>
                ))
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
}