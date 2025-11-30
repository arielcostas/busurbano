import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/map", "routes/map.tsx"),
  route("/lines", "routes/lines.tsx"),
  route("/stops", "routes/stops.tsx"),
  route("/stops/:id", "routes/stops-$id.tsx"),
  route("/settings", "routes/settings.tsx"),
  route("/about", "routes/about.tsx"),
  route("/favourites", "routes/favourites.tsx"),
] satisfies RouteConfig;
