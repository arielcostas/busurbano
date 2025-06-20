# Busurbano

Busurbano is a web application designed to help users find bus stops and arrival times for urban buses in Vigo, Spain.

## Features

- **Bus Stop List**: View a list of all bus stops, search for specific stops, and mark your favourite stops.
- **Real-time Bus Arrival Estimates**: Get real-time estimates for bus arrivals at various stops.
- **Interactive Map**: View bus stops on an interactive map.
- **Settings**: Customize the theme (light/dark mode) and table style (regular/grouped).

## Technologies Used

- **Frontend**: React 19, react-router, TypeScript, Vite
- **Backend**:
  - ASP.NET Core 9 Web API
  - [Costasdev.VigoTransitApi](https://github.com/arielcostas/VigoTransitApi)
- **Mapping**:
  - [Leaflet](https://leafletjs.com/) via [React-Leaflet](https://react-leaflet.js.org/)
  - [Leaflet Locate Control](https://github.com/domoritz/leaflet-locatecontrol)
  - [Leaflet Marker Cluster](https://github.com/Leaflet/Leaflet.markercluster)
- **Styling**: Good old CSS
- **Fonts**: [Roboto Variable](https://fonts.google.com/specimen/Roboto) via [@fontsource](https://fontsource.org/fonts/outfit)

## Getting Started

### Prerequisites

- Node 22 and npm
- .NET 9 SDK

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/arielcostas/busurbano.git
   cd busurbano
   ```

2. Install dependencies:

   ```sh
   npm i
   dotnet restore
   ```

### Running the Application

1. Start the entire application:

    ```sh
    npm run dev
    ```

2. Open your browser and navigate to `http://localhost:5173`.

### Deployment

The application is (or will soon be) deployed to [busurbano.costas.dev](https://busurbano.costas.dev) via GitHub Actions, on a normal Ubuntu server with Nginx and a reverse proxy.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licenced under the BSD 3-Clause licence, meaning you can do whatever you want with it as long as you include the original copyright and license notice.

Note that the data served by the application is obtained from [datos.vigo.org](https://datos.vigo.org) under the [Open Data Commons Attribution License](https://opendefinition.org/licenses/odc-by/), so you must comply with the terms of that license if you use the data in your own projects.
