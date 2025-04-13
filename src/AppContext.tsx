/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { LatLngTuple } from 'leaflet';

type Theme = 'light' | 'dark';
type TableStyle = 'regular'|'grouped';

interface MapState {
  center: LatLngTuple;
  zoom: number;
  userLocation: LatLngTuple | null;
  hasLocationPermission: boolean;
}

interface AppContextProps {
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  toggleTheme: () => void;
  
  tableStyle: TableStyle;
  setTableStyle: React.Dispatch<React.SetStateAction<TableStyle>>;
  toggleTableStyle: () => void;

  mapState: MapState;
  setMapCenter: (center: LatLngTuple) => void;
  setMapZoom: (zoom: number) => void;
  setUserLocation: (location: LatLngTuple | null) => void;
  setLocationPermission: (hasPermission: boolean) => void;
  updateMapState: (center: LatLngTuple, zoom: number) => void;
}

// Coordenadas por defecto centradas en Vigo
const DEFAULT_CENTER: LatLngTuple = [42.229188855975046, -8.72246955783102];
const DEFAULT_ZOOM = 14;

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  //#region Theme
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme as Theme;
    }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  //#endregion

  //#region Table Style
  const [tableStyle, setTableStyle] = useState<TableStyle>(() => {
    const savedTableStyle = localStorage.getItem('tableStyle');
    if (savedTableStyle) {
      return savedTableStyle as TableStyle;
    }
    return 'regular';
  });

  const toggleTableStyle = () => {
    setTableStyle((prevTableStyle) => (prevTableStyle === 'regular' ? 'grouped' : 'regular'));
  }

  useEffect(() => {
    localStorage.setItem('tableStyle', tableStyle);
  }, [tableStyle]);
  //#endregion

  //#region Map State
  const [mapState, setMapState] = useState<MapState>(() => {
    const savedMapState = localStorage.getItem('mapState');
    if (savedMapState) {
      try {
        const parsed = JSON.parse(savedMapState);
        return {
          center: parsed.center || DEFAULT_CENTER,
          zoom: parsed.zoom || DEFAULT_ZOOM,
          userLocation: parsed.userLocation || null,
          hasLocationPermission: parsed.hasLocationPermission || false
        };
      } catch (e) {
        console.error('Error parsing saved map state', e);
      }
    }
    return {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      userLocation: null,
      hasLocationPermission: false
    };
  });

  const setMapCenter = (center: LatLngTuple) => {
    setMapState(prev => {
      const newState = { ...prev, center };
      localStorage.setItem('mapState', JSON.stringify(newState));
      return newState;
    });
  };

  const setMapZoom = (zoom: number) => {
    setMapState(prev => {
      const newState = { ...prev, zoom };
      localStorage.setItem('mapState', JSON.stringify(newState));
      return newState;
    });
  };

  const setUserLocation = (userLocation: LatLngTuple | null) => {
    setMapState(prev => {
      const newState = { ...prev, userLocation };
      localStorage.setItem('mapState', JSON.stringify(newState));
      return newState;
    });
  };

  const setLocationPermission = (hasLocationPermission: boolean) => {
    setMapState(prev => {
      const newState = { ...prev, hasLocationPermission };
      localStorage.setItem('mapState', JSON.stringify(newState));
      return newState;
    });
  };

  const updateMapState = (center: LatLngTuple, zoom: number) => {
    setMapState(prev => {
      const newState = { ...prev, center, zoom };
      localStorage.setItem('mapState', JSON.stringify(newState));
      return newState;
    });
  };
  //#endregion

  // Tratar de obtener la ubicación del usuario cuando se carga la aplicación si ya se había concedido permiso antes
  useEffect(() => {
    if (mapState.hasLocationPermission && !mapState.userLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation([latitude, longitude]);
          },
          (error) => {
            console.error('Error getting location:', error);
            setLocationPermission(false);
          }
        );
      }
    }
  }, []);

  return (
    <AppContext.Provider value={{ 
      theme, 
      setTheme, 
      toggleTheme, 
      tableStyle, 
      setTableStyle, 
      toggleTableStyle,
      mapState,
      setMapCenter,
      setMapZoom,
      setUserLocation,
      setLocationPermission,
      updateMapState
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within a AppProvider');
  }
  return context;
};