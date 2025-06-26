import { Navigate, redirect, type LoaderFunction } from "react-router";

export default function Index() {
  return <Navigate to={"/stops"} replace />;
}
