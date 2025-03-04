# UrbanoVigo Web

UrbanoVigo Web is a web application designed to help users find bus stops and arrival times for urban buses in Vigo, Spain.

## Features

- **Real-time Bus Arrival Estimates**: Get real-time estimates for bus arrivals at various stops.
- **Bus Stop List**: View a list of all bus stops, search for specific stops, and mark your favorite stops.
- **Interactive Map**: View bus stops on an interactive map.
- **Settings**: Customize the theme (light/dark mode) and table style (regular/grouped).

## Technologies Used

- **Frontend**: React 19, react-router, TypeScript, Vite
- **Backend** (.NET): 
    - Azure Functions
    - [Costasdev.VigoTransitApi](https://github.com/arielcostas/urbanovigo)
- **Mapping**: 
    - [Leaflet](https://leafletjs.com/) via [React-Leaflet](https://react-leaflet.js.org/)
    - [Leaflet Locate Control](https://github.com/domoritz/leaflet-locatecontrol)
    - [Leaflet Marker Cluster](https://github.com/Leaflet/Leaflet.markercluster)
- **Styling**: CSS, Fontsource Variable

## Getting Started

### Prerequisites

- Node 22 and npm
- .NET 8 SDK
- Azure Static Web Apps CLI (swa) `npm install -g @azure/static-web-apps-cli`

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/arielcostas/urbanovigo-web.git
   cd urbanovigo-web
   ```

2. Install frontend dependencies:
   ```sh
   npm install
   ```

3. Install backend dependencies:
   ```sh
   cd Backend
   dotnet restore
   cd ..
   ```

### Running the Application

1. Start the application with the Static Web Apps CLI:
    ```sh
    swa start
    ```

3. Open your browser and navigate to `http://localhost:5173`.

### Deployment

The application is configured to be deployed to Azure Static Web Apps via GitHub Actions. To deploy the application to Azure by yourself, remove it in your fork and create a new "Static Web App" resource in the Azure Portal with the repository and branch you want to deploy.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the BSD 3-Clause licence, meaning you can do whatever you want with it as long as you include the original copyright and license notice.

Note that the data served by the application is obtained from [datos.vigo.org](https://datos.vigo.org) under the [Open Data Commons Attribution License](https://opendefinition.org/licenses/odc-by/), so you must comply with the terms of that license if you use the data in your own projects.