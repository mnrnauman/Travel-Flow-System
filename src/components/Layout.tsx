import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, Map, BookOpen, DollarSign, FileText,
  Package, UserCog, BarChart3, Zap, Plane, LogOut, ChevronDown,
  Menu, TrendingUp, Settings, User, Bell, Search, X,
  CalendarDays, AlertCircle, AlertTriangle, Info, CheckCircle
} from 'lucide-react'
import api from '../lib/api'

interface LayoutProps {
  activePage: string
  onNavigate: (page: string) => void
  children: React.ReactNode
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'main' },
  { id: 'leads', label: 'Leads', icon: TrendingUp, section: 'sales' },
  { id: 'customers', label: 'Customers', icon: Users, section: 'sales' },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, section: 'sales' },
  { id: 'itineraries', label: 'Itinerary Builder', icon: Map, section: 'operations' },
  { id: 'quotations', label: 'Quotations', icon: FileText, section: 'operations' },
  { id: 'bookings', label: 'Bookings', icon: BookOpen, section: 'operations' },
  { id: 'invoices', label: 'Invoices & Payments', icon: DollarSign, section: 'finance' },
  { id: 'commissions', label: 'Commissions', icon: TrendingUp, section: 'finance' },
  { id: 'suppliers', label: 'Suppliers', icon: Package, section: 'operations' },
  { id: 'team', label: 'Team & Agents', icon: UserCog, section: 'admin' },
  { id: 'reports', label: 'Reports', icon: BarChart3, section: 'admin' },
  { id: 'automation', label: 'Automation', icon: Zap, section: 'admin' },
]

const sections: Record<string, string> = {
  main: 'Overview',
  sales: 'Sales',
  operations: 'Operations',
  finance: 'Finance',
  admin: 'Administration'
}

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard', leads: 'Lead Management', customers: 'Customers',
  itineraries: 'Itinerary Builder', quotations: 'Quotations', bookings: 'Bookings',
  invoices: 'Invoices & Payments', commissions: 'Commission Tracking', suppliers: 'Suppliers',
  team: 'Team & Agents', reports: 'Reports & Analytics', automation: 'Automation',
  calendar: 'Calendar', settings: 'Settings', profile: 'My Profile'
}

const NOTIF_ICON: Record<string, any> = {
  error: AlertCircle, warning: AlertTriangle, info: Info, success: CheckCircle
}
const NOTIF_COLOR: Record<string, string> = {
  error: '#ef4444', warning: '#f59e0b', info: '#3b82f6', success: '#10b981'
}

export default function Layout({ activePage, onNavigate, children }: LayoutProps) {
  const { user, agency, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifCount, setNotifCount] = useState(0)
  const searchRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const searchTimer = useRef<any>(null)

  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN'

  // Fetch notifications on mount + every 60s
  const fetchNotifications = useCallback(async () => {
    try {
      const r = await api.get('/notifications')
      setNotifications(r.data.notifications || [])
      setNotifCount(r.data.count || 0)
    } catch {}
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Search with debounce
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!searchQ.trim() || searchQ.length < 2) {
      setSearchResults([])
      setSearchOpen(false)
      return
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const r = await api.get(`/search?q=${encodeURIComponent(searchQ)}`)
        setSearchResults(r.data.results || [])
        setSearchOpen(true)
      } catch {}
      setSearching(false)
    }, 300)
  }, [searchQ])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearchResult = (result: any) => {
    setSearchQ('')
    setSearchOpen(false)
    onNavigate(result.type === 'invoice' ? 'invoices' : result.type === 'booking' ? 'bookings' : result.type === 'customer' ? 'customers' : 'leads')
  }

  const grouped = navItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = []
    acc[item.section].push(item)
    return acc
  }, {} as Record<string, typeof navItems>)

  const sectionOrder = ['main', 'sales', 'operations', 'finance', 'admin']

  const typeColor: Record<string, string> = { lead: '#3b82f6', customer: '#10b981', booking: '#8b5cf6', invoice: '#f59e0b' }
  const typeLabel: Record<string, string> = { lead: 'Lead', customer: 'Customer', booking: 'Booking', invoice: 'Invoice' }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar" style={{ display: mobileOpen ? 'flex' : undefined }}>
        <div className="sidebar-logo">
          <div className="logo-icon">
            {agency?.logo ? <img src={agency.logo} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} /> : <Plane size={18} />}
          </div>
          <div>
            <div className="logo-text">Travel Agency CRM</div>
            <div className="logo-sub">System</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sectionOrder.map(section => {
            const items = grouped[section]
            if (!items) return null
            return (
              <div key={section}>
                <div className="nav-section-title">{sections[section]}</div>
                {items.map(item => {
                  const Icon = item.icon
                  return (
                    <button key={item.id}
                      className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                      onClick={() => { onNavigate(item.id); setMobileOpen(false) }}>
                      <Icon size={15} />
                      {item.label}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8, marginBottom: 8 }}>
            <button className={`nav-item ${activePage === 'profile' ? 'active' : ''}`}
              onClick={() => { onNavigate('profile'); setMobileOpen(false) }}
              style={{ width: '100%' }}>
              <User size={14} />
              My Profile
            </button>
            {isAdminOrManager && (
              <button className={`nav-item ${activePage === 'settings' ? 'active' : ''}`}
                onClick={() => { onNavigate('settings'); setMobileOpen(false) }}
                style={{ width: '100%' }}>
                <Settings size={14} />
                Settings
              </button>
            )}
          </div>
          <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>
              {user?.firstName} {user?.lastName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 1 }}>
              {user?.role?.replace('_', ' ')}
            </div>
          </div>
          <button className="nav-item" onClick={logout} style={{ width: '100%', color: '#f87171' }}>
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn-icon" onClick={() => setMobileOpen(!mobileOpen)} style={{ display: 'none' }}>
              <Menu size={20} />
            </button>
            <h1 className="top-bar-title">{pageTitles[activePage] || activePage}</h1>
          </div>

          <div className="top-bar-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Global Search */}
            <div ref={searchRef} style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '6px 12px' }}>
                <Search size={14} color="var(--gray-400)" />
                <input
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder="Search leads, customers..."
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, width: 200, color: 'var(--gray-700)' }}
                />
                {searchQ && (
                  <button onClick={() => { setSearchQ(''); setSearchOpen(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: 0 }}>
                    <X size={13} />
                  </button>
                )}
              </div>

              {searchOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6,
                  background: 'white', borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                  border: '1px solid var(--gray-200)', zIndex: 1000, overflow: 'hidden', minWidth: 320
                }}>
                  {searching ? (
                    <div style={{ padding: 16, fontSize: 13, color: 'var(--gray-500)', textAlign: 'center' }}>Searching...</div>
                  ) : searchResults.length === 0 ? (
                    <div style={{ padding: 16, fontSize: 13, color: 'var(--gray-500)', textAlign: 'center' }}>No results found</div>
                  ) : searchResults.map(r => (
                    <div key={r.id + r.type}
                      onClick={() => handleSearchResult(r)}
                      style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--gray-100)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-50)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <span style={{
                        padding: '2px 7px', borderRadius: 10, fontSize: 10, fontWeight: 600,
                        background: (typeColor[r.type] || '#6b7280') + '20',
                        color: typeColor[r.type] || '#6b7280'
                      }}>
                        {typeLabel[r.type] || r.type}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                        {r.sub && <div style={{ fontSize: 11, color: 'var(--gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sub}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button onClick={() => setNotifOpen(o => !o)} style={{
                position: 'relative', background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
                borderRadius: 8, padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center'
              }}>
                <Bell size={16} color="var(--gray-600)" />
                {notifCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -4, background: '#ef4444', color: 'white',
                    borderRadius: 10, fontSize: 10, fontWeight: 700, minWidth: 16, height: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px'
                  }}>
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 6, width: 380,
                  background: 'white', borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                  border: '1px solid var(--gray-200)', zIndex: 1000, overflow: 'hidden'
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>Notifications</span>
                    {notifCount > 0 && <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{notifCount} alerts</span>}
                  </div>
                  <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
                        All clear — no alerts!
                      </div>
                    ) : notifications.map(n => {
                      const Icon = NOTIF_ICON[n.type] || Info
                      const color = NOTIF_COLOR[n.type] || '#6b7280'
                      return (
                        <div key={n.id}
                          onClick={() => { onNavigate(n.link); setNotifOpen(false) }}
                          style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-100)', cursor: 'pointer', display: 'flex', gap: 10 }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-50)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={14} color={color} />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' }}>{n.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{n.message}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* User avatar */}
            <div onClick={() => onNavigate('profile')} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
              borderRadius: 8, padding: '6px 12px', cursor: 'pointer'
            }}>
              <div className="avatar" style={{ width: 26, height: 26, fontSize: 10 }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {user?.firstName} {user?.lastName}
              </span>
              <ChevronDown size={14} color="var(--gray-400)" />
            </div>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  )
}
