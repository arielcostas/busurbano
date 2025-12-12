import { useEffect, useState } from "react";
import {
  type PlannerSearchResult,
  type RoutePlan,
  planRoute,
} from "../data/PlannerApi";

const STORAGE_KEY = "planner_last_route";
const EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours

interface StoredRoute {
  timestamp: number;
  origin: PlannerSearchResult;
  destination: PlannerSearchResult;
  plan: RoutePlan;
}

export function usePlanner() {
  const [origin, setOrigin] = useState<PlannerSearchResult | null>(null);
  const [destination, setDestination] = useState<PlannerSearchResult | null>(
    null
  );
  const [plan, setPlan] = useState<RoutePlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data: StoredRoute = JSON.parse(stored);
        if (Date.now() - data.timestamp < EXPIRY_MS) {
          setOrigin(data.origin);
          setDestination(data.destination);
          setPlan(data.plan);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const searchRoute = async (
    from: PlannerSearchResult,
    to: PlannerSearchResult,
    time?: Date,
    arriveBy: boolean = false
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await planRoute(
        from.lat,
        from.lon,
        to.lat,
        to.lon,
        time,
        arriveBy
      );
      setPlan(result);
      setOrigin(from);
      setDestination(to);

      // Save to storage
      const toStore: StoredRoute = {
        timestamp: Date.now(),
        origin: from,
        destination: to,
        plan: result,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (err) {
      setError("Failed to calculate route. Please try again.");
      setPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const clearRoute = () => {
    setPlan(null);
    setOrigin(null);
    setDestination(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    origin,
    setOrigin,
    destination,
    setDestination,
    plan,
    loading,
    error,
    searchRoute,
    clearRoute,
  };
}
