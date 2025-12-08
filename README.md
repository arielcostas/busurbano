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
  - [MapLibre GL JS](https://maplibre.org)
  - OpenStreetMap
  - [OpenFreeMap tiles](https://openfreemap.org)
- **Styling**: Good old CSS
- **Fonts**: [Roboto Variable](https://fonts.google.com/specimen/Roboto) via [@fontsource](https://fontsource.org/fonts/roboto)

## Getting Started

### Prerequisites

- Node 22 and npm
- .NET 9 SDK

### Installation

TODO: Update instructions

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

## Code Formatting and Linting

This project uses automated formatting and linting tools to ensure code consistency.

### Frontend (TypeScript/JavaScript)

- **Prettier**: Code formatting
- **ESLint**: Code linting

```sh
cd src/frontend
npm run format        # Auto-format all files
npm run checkformat   # Check formatting without making changes
npm run lint          # Run ESLint
npm run lint:fix      # Auto-fix ESLint issues
```

### Python

- **Ruff**: Formatting and linting (configured in `pyproject.toml`)

```sh
cd src/gtfs_perstop_report
ruff format .         # Format Python files
ruff check .          # Check for linting issues
```

### C #

- **EditorConfig**: Formatting rules (configured in `.editorconfig`)
- Format on save is enabled in VSCode

### VSCode Setup

When you open this project in VSCode, you'll be prompted to install recommended extensions. These include:

- Prettier
- ESLint
- Ruff
- C# Dev Kit
- EditorConfig

The project is configured to auto-format on save.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licenced under the BSD 3-Clause licence, meaning you can do whatever you want with it as long as you include the original copyright and license notice.

Note that the data served by the application is obtained from [datos.vigo.org](https://datos.vigo.org) under the [Open Data Commons Attribution License](https://opendefinition.org/licenses/odc-by/), so you must comply with the terms of that license if you use the data in your own projects.
