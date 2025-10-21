import { useApp } from "../AppContext";
import { getAvailableRegions } from "../data/RegionConfig";
import "./RegionSelector.css";

export function RegionSelector() {
  const { region, setRegion } = useApp();
  const regions = getAvailableRegions();

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRegion = e.target.value as any;
    setRegion(newRegion);
  };

  return (
    <div className="region-selector">
      <label htmlFor="region-select" className="region-label">
        Región:
      </label>
      <select
        id="region-select"
        className="region-select"
        value={region}
        onChange={handleRegionChange}
      >
        {regions.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
    </div>
  );
}
