import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { MapPin, Map, Info } from 'lucide-react';
import { useTheme } from './ThemeContext';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    {
      name: 'Paradas',
      icon: MapPin,
      path: '/stops'
    },
    {
      name: 'Mapa',
      icon: Map,
      path: '/map'
    },
    {
      name: 'Acerca de',
      icon: Info,
      path: '/about'
    }
  ];

  return (
    <div className="app-container">
      <main className="main-content">
        {children}
      </main>
      <nav className="nav-bar">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);

          return (
            <Link 
              key={item.name}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={24} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}