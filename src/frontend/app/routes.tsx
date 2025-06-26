import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("/stops", "routes/stoplist.tsx"),
  route("/map", "routes/map.tsx"),
  route("/estimates/:id", "routes/estimates-$id.tsx"),
  route("/settings", "routes/settings.tsx"),
] satisfies RouteConfig;
