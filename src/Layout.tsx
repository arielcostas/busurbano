import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { MapPin, Map, Info } from 'lucide-react';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  
  const navItems = [
    {
      name: 'Stops',
      icon: MapPin,
      path: '/stops'
    },
    {
      name: 'Maps',
      icon: Map,
      path: '/map'
    },
    {
      name: 'About',
      icon: Info,
      path: '/about'
    }
  ];

  return (
    <div className="app-container">
      {/* Main content area */}
      <main className="main-content">
        {children}
      </main>
      
      {/* Android style bottom navigation bar */}
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