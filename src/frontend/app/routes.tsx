import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/map", "routes/map.tsx"),
  route("/estimates/:id", "routes/estimates-$id.tsx"),
  route("/timetable/:id", "routes/timetable-$id.tsx"),
  route("/settings", "routes/settings.tsx"),
] satisfies RouteConfig;
