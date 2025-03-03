import '@fontsource-variable/outfit'
import './styles/Pages.css'

import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { StopList } from './pages/StopList.tsx'
import { Estimates } from './pages/Estimates.tsx'
import { StopMap } from './pages/Map.tsx'
import { Layout } from './Layout.tsx'
import { Settings } from './pages/Settings.tsx'
import { AppProvider } from './AppContext.tsx'
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
