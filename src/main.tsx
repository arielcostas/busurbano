import '@fontsource-variable/outfit'
import './styles/Pages.css'

import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { StopList } from './pages/StopList.tsx'
import { Estimates } from './pages/Estimates.tsx'
import { StopMap } from './pages/Map.tsx'
import { Layout } from './Layout.tsx'
import { Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout><Navigate to="/stops" /></Layout>,
  },
  {
    path: '/stops',
    element: <Layout><StopList /></Layout>,
  },
  {
    path: '/map',
    element: <Layout><StopMap /></Layout>,
  },
  {
    path: '/estimates/:stopId',
    element: <Layout><Estimates /></Layout>
  },
  {
    path: '/about',
    element: <Layout><About /></Layout>
  }
])

function About() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme as 'light' | 'dark';
    }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="page-container about-page">
      <h1 className="page-title">About InfoBus App</h1>
      <p className="about-description">This application helps you find bus stops and check bus arrival estimates.</p>
      <p className="about-version">Version 1.0.0</p>
      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
      </button>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />,
)
