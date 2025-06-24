import { createControlComponent } from '@react-leaflet/core';
import { LocateControl as LeafletLocateControl, type LocateOptions } from 'leaflet.locatecontrol';
import "leaflet.locatecontrol/dist/L.Control.Locate.min.css";
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useApp } from '../AppContext';

interface EnhancedLocateControlProps {
  options?: LocateOptions;
}

// Componente que usa el contexto para manejar la localización
export const EnhancedLocateControl = (props: EnhancedLocateControlProps) => {
  const map = useMap();
  const { mapState, setUserLocation, setLocationPermission } = useApp();

  useEffect(() => {
    // Configuración por defecto del control de localización
    const defaultOptions: LocateOptions = {
      position: 'topright',
      strings: {
        title: 'Mostrar mi ubicación',
      },
      flyTo: true,
      onLocationError: (err) => {
        console.error('Error en la localización:', err);
        setLocationPermission(false);
      },
      returnToPrevBounds: true,
      showPopup: false,
    };

    // Combinamos las opciones por defecto con las personalizadas
    const options = { ...defaultOptions, ...props.options };

    // Creamos la instancia del control
    const locateControl = new LeafletLocateControl(options);

    // Añadimos el control al mapa
    locateControl.addTo(map);

    // Si tenemos permiso de ubicación y ya conocemos la ubicación del usuario,
    // podemos activarla automáticamente
    if (mapState.hasLocationPermission && mapState.userLocation) {
      // Esperamos a que el mapa esté listo
      setTimeout(() => {
        try {
          locateControl.start();
        } catch (e) {
          console.error('Error al iniciar la localización automática', e);
        }
      }, 1000);
    }

    return () => {
      // Limpieza al desmontar el componente
      locateControl.remove();
    };
  }, [map, mapState.hasLocationPermission, mapState.userLocation, props.options, setLocationPermission, setUserLocation]);

  return null;
};

// Exportamos también el control base por compatibilidad
export const LocateControl = createControlComponent(
  (props) => new LeafletLocateControl(props)
);
