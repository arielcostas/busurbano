import '@fontsource-variable/outfit'
import './styles/Pages.css'

import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { StopList } from './pages/StopList.tsx'
import { Estimates } from './pages/Estimates.tsx'
import { StopMap } from './pages/Map.tsx'
import { Layout } from './Layout.tsx'
import { About } from './pages/About.tsx'
import { ThemeProvider } from './ThemeContext'
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
    path: '/about',
    element: <Layout><About /></Layout>
  }
])

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </ErrorBoundary>
)
