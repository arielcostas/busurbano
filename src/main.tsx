import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { StopList } from './pages/StopList.tsx'
import { Estimates } from './pages/Estimates.tsx'
import { StopMap } from './pages/Map.tsx'
import { Layout } from './Layout.tsx'
import './styles/Pages.css'

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
  return (
    <div className="page-container about-page">
      <h1 className="page-title">About InfoBus App</h1>
      <p className="about-description">This application helps you find bus stops and check bus arrival estimates.</p>
      <p className="about-version">Version 1.0.0</p>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />,
)
