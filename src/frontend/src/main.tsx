import '@fontsource-variable/outfit'
import './styles/Pages.css'

import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { StopList } from './pages/StopList'
import { Estimates } from './pages/Estimates'
import { StopMap } from './pages/Map'
import { Layout } from './Layout'
import { Settings } from './pages/Settings'
import { AppProvider } from './AppContext'
import ErrorBoundary from './ErrorBoundary'

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
    path: '/settings',
    element: <Layout><Settings /></Layout>
  }
])

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  </ErrorBoundary>
)
