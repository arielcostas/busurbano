import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { MapPin, Map, Settings } from 'lucide-react';
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
      name: 'Ajustes',
      icon: Settings,
      path: '/settings'
    }
  ];

  return (
    <>
      <main className="main-content">
        {children}
      </main>
      <footer>
        <nav className="navigation-bar">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`navigation-bar__link ${isActive ? 'active' : ''}`}
              >
                <Icon size={24} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </footer>
    </>
  );
}
