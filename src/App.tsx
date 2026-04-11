import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import SuperAdmin from './pages/SuperAdmin'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import Customers from './pages/Customers'
import Itineraries from './pages/Itineraries'
import Quotations from './pages/Quotations'
import Bookings from './pages/Bookings'
import Invoices from './pages/Invoices'
import Suppliers from './pages/Suppliers'
import Team from './pages/Team'
import Reports from './pages/Reports'
import Automation from './pages/Automation'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import Calendar from './pages/Calendar'

const PAGES: Record<string, React.ComponentType<any>> = {
  dashboard: Dashboard,
  leads: Leads,
  customers: Customers,
  itineraries: Itineraries,
  quotations: Quotations,
  bookings: Bookings,
  invoices: Invoices,
  suppliers: Suppliers,
  team: Team,
  reports: Reports,
  automation: Automation,
  settings: Settings,
  profile: Profile,
  calendar: Calendar,
}

function getSlugFromPath(): string | null {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '')
  if (!path || path === 'index.html') return null
  return path
}

function Spinner() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f8fafc'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40, border: '3px solid #e2e8f0',
          borderTopColor: '#2563eb', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 12px'
        }} />
        <div style={{ fontSize: 13, color: '#64748b' }}>Loading...</div>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { user, superAdmin, isSuperAdmin, loading } = useAuth()
  const [activePage, setActivePage] = useState('dashboard')
  const [slug] = useState<string | null>(getSlugFromPath)

  if (loading) return <Spinner />

  // Not logged in
  if (!user && !superAdmin) {
    return <Login slug={slug || undefined} />
  }

  // Super admin dashboard
  if (isSuperAdmin) {
    return <SuperAdmin />
  }

  // Normal agency user — show CRM
  const PageComponent = PAGES[activePage] || Dashboard

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {activePage === 'calendar'
        ? <Calendar onNavigate={setActivePage} />
        : <PageComponent />}
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
