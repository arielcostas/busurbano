import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration
} from "react-router";

import type { Route } from "./+types/root";
import "@fontsource-variable/roboto";
import "./root.css";

//#region Maplibre setup
import "maplibre-theme/icons.default.css";
import "maplibre-theme/modern.css";
import { Protocol } from "pmtiles";
import maplibregl, { type LngLatLike } from "maplibre-gl";
import { AppProvider } from "./AppContext";
const pmtiles = new Protocol();
maplibregl.addProtocol("pmtiles", pmtiles.tile);
//#endregion

import "./i18n";

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then((registration) => {
      console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
}

export const links: Route.LinksFunction = () => [];

export function HydrateFallback() {
  return "Loading...";
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <link rel="icon" type="image/jpg" href="/logo-512.jpg" />
        <link rel="icon" href="/favicon.ico" sizes="64x64" />
        <link rel="apple-touch-icon" href="/logo-512.jpg" sizes="512x512" />
        <meta name="theme-color" content="#007bff" />

        <link rel="canonical" href="https://urbanovigo.costas.dev/" />

        <meta name="description" content="Aplicación web para encontrar paradas y tiempos de llegada de los autobuses urbanos de Vigo, España." />
        <meta name="keywords" content="Vigo, autobús, urbano, parada, tiempo, llegada, transporte, público, España" />
        <meta name="author" content="Ariel Costas Guerrero" />

        <meta property="og:title" content="UrbanoVigo Web" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://urbanovigo.costas.dev/" />
        <meta property="og:image" content="https://urbanovigo.costas.dev/logo-512.jpg" />
        <meta property="og:description" content="Aplicación web para encontrar paradas y tiempos de llegada de los autobuses urbanos de Vigo, España." />

        <link rel="manifest" href="/manifest.webmanifest" />

        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />

        <title>Busurbano</title>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

  // Helper: check if coordinates are within Vigo bounds
  function isWithinVigo(lngLat: LngLatLike): boolean {
    let lng: number, lat: number;
    if (Array.isArray(lngLat)) {
      [lng, lat] = lngLat;
    } else if ('lng' in lngLat && 'lat' in lngLat) {
      lng = lngLat.lng;
      lat = lngLat.lat;
    } else {
      return false;
    }
    // Rough bounding box for Vigo
    return lat >= 42.18 && lat <= 42.30 && lng >= -8.78 && lng <= -8.65;
  }

import NavBar from "./components/NavBar";

export default function App() {
  return (
    <AppProvider>
      <main className="main-content">
        <Outlet />
      </main>
      <footer>
        <NavBar />
      </footer>
    </AppProvider>



  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
