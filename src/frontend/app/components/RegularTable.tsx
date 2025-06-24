import { type StopDetails } from "../routes/estimates-$id";
import LineIcon from "./LineIcon";

interface RegularTableProps {
    data: StopDetails;
    dataDate: Date | null;
}

export const RegularTable: React.FC<RegularTableProps> = ({ data, dataDate }) => {

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
}
