import { useApi } from '../hooks/useApi'
import { Spinner, ErrorBox } from '../components/ui'
import {
  TrendingUp, Users, BookOpen, DollarSign, Target,
  CheckCircle, Plane, Phone, AlertTriangle, Clock,
  Plus, FileText, UserPlus, BarChart3, ShieldAlert
} from 'lucide-react'

interface DashboardProps {
  onNavigate?: (page: string) => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { data: stats, loading, error } = useApi<any>('/reports/dashboard')
  const { data: today } = useApi<any>('/reports/today')
  const { data: monthly } = useApi<any>('/reports/monthly')

  if (loading) return <Spinner />
  if (error) return <ErrorBox message={error} />
  if (!stats) return null

  const { leads, customers, bookings, revenue, agents } = stats

  const statCards = [
    { label: 'Total Leads', value: leads.total, sub: `+${leads.thisMonth} this month`, icon: TrendingUp, color: 'blue' },
    { label: 'Customers', value: customers.total, sub: 'Registered profiles', icon: Users, color: 'green' },
    { label: 'Bookings', value: bookings.total, sub: `+${bookings.thisMonth} this month`, icon: BookOpen, color: 'amber' },
    { label: 'Total Revenue', value: `$${(revenue.total || 0).toLocaleString()}`, sub: `$${(revenue.outstanding || 0).toLocaleString()} outstanding`, icon: DollarSign, color: 'purple' },
    { label: 'Conversion Rate', value: `${leads.conversionRate}%`, sub: `${leads.converted} converted`, icon: Target, color: 'green' },
    { label: 'Collected', value: `$${(revenue.collected || 0).toLocaleString()}`, sub: `of $${(revenue.total || 0).toLocaleString()} invoiced`, icon: CheckCircle, color: 'blue' },
  ]

  const leadStatusColors: Record<string, string> = {
    NEW: '#3b82f6', CONTACTED: '#f59e0b', PROPOSAL_SENT: '#8b5cf6',
    NEGOTIATING: '#f97316', BOOKED: '#10b981', LOST: '#ef4444'
  }

  const bookingStatusColors: Record<string, string> = {
    CONFIRMED: '#10b981', IN_PROGRESS: '#f59e0b', COMPLETED: '#6366f1',
    CANCELLED: '#ef4444', DRAFT: '#94a3b8'
  }

  const maxRevenue = monthly?.months
    ? Math.max(...monthly.months.map((m: any) => m.revenue), 1)
    : 1

  const todayItems = [
    ...(today?.departures || []).map((b: any) => ({
      type: 'departure', color: '#2563eb', icon: Plane,
      title: `${b.customer?.firstName} ${b.customer?.lastName}`,
      sub: `Departure — ${b.title || b.bookingNumber}`,
      id: b.id, link: 'bookings'
    })),
    ...(today?.followUps || []).map((l: any) => ({
      type: 'followup', color: '#059669', icon: Phone,
      title: `${l.firstName} ${l.lastName}`,
      sub: `Follow-up — ${l.destination || l.email || 'No destination'}`,
      id: l.id, link: 'leads'
    })),
    ...(today?.overdueInvoices || []).map((inv: any) => ({
      type: 'invoice', color: '#d97706', icon: AlertTriangle,
      title: `${inv.customer?.firstName} ${inv.customer?.lastName}`,
      sub: `Overdue Invoice — ${inv.invoiceNumber}`,
      id: inv.id, link: 'invoices'
    })),
  ]

  const quickActions = [
    { label: 'New Lead', icon: UserPlus, color: '#2563eb', page: 'leads' },
    { label: 'New Booking', icon: BookOpen, color: '#10b981', page: 'bookings' },
    { label: 'New Invoice', icon: FileText, color: '#f59e0b', page: 'invoices' },
    { label: 'View Reports', icon: BarChart3, color: '#8b5cf6', page: 'reports' },
  ]

  const expiringPassports = today?.expiringPassports || []

  const getDaysUntilExpiry = (dateStr: string) => {
    const expiry = new Date(dateStr)
    const now = new Date()
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <div>
      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {quickActions.map(qa => {
          const Icon = qa.icon
          return (
            <button key={qa.label}
              onClick={() => onNavigate?.(qa.page)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                background: qa.color + '12', border: `1px solid ${qa.color}30`,
                borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                color: qa.color, transition: 'all 0.15s'
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = qa.color + '20' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = qa.color + '12' }}
            >
              <Icon size={14} />
              {qa.label}
            </button>
          )
        })}
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div className="stat-card" key={i}>
              <div className={`stat-icon ${card.color}`}><Icon size={20} /></div>
              <div className="stat-info">
                <div className="stat-label">{card.label}</div>
                <div className="stat-value">{card.value}</div>
                <div className="stat-change">{card.sub}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Passport Expiry Alert */}
      {expiringPassports.length > 0 && (
        <div className="card" style={{ marginBottom: 16, borderLeft: '4px solid #f59e0b' }}>
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldAlert size={15} color="#f59e0b" />
              Passports Expiring Soon
            </span>
            <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
              {expiringPassports.length} within 90 days
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8, padding: '0 16px 16px' }}>
            {expiringPassports.map((c: any) => {
              const days = getDaysUntilExpiry(c.passportExpiry)
              const urgent = days <= 30
              return (
                <div key={c.id}
                  onClick={() => onNavigate?.('customers')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    background: urgent ? '#fef3c710' : '#fef9ec',
                    border: `1px solid ${urgent ? '#fbbf2440' : '#fde68a'}`,
                    borderRadius: 8, cursor: 'pointer',
                    borderLeft: `3px solid ${urgent ? '#ef4444' : '#f59e0b'}`
                  }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: urgent ? '#fee2e2' : '#fef3c7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: urgent ? '#dc2626' : '#d97706', flexShrink: 0
                  }}>
                    {c.firstName?.[0]}{c.lastName?.[0]}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)' }}>
                      {c.firstName} {c.lastName}
                    </div>
                    <div style={{ fontSize: 11, color: urgent ? '#dc2626' : '#d97706', fontWeight: 500 }}>
                      {urgent ? `⚠ Expires in ${days} day${days !== 1 ? 's' : ''}` : `Expires in ${days} days`}
                      {c.passportNumber ? ` · ${c.passportNumber}` : ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Today's Agenda */}
      {todayItems.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={15} color="var(--primary)" />
              Today's Agenda
            </span>
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{todayItems.length} item{todayItems.length !== 1 ? 's' : ''}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, padding: '0 16px 16px' }}>
            {todayItems.map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i}
                  onClick={() => onNavigate?.(item.link)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    background: item.color + '08', border: `1px solid ${item.color}20`,
                    borderRadius: 8, cursor: 'pointer',
                    borderLeft: `3px solid ${item.color}`
                  }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: item.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon size={15} color={item.color} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.sub}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid-2" style={{ gap: 16 }}>
        {/* Lead Pipeline */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Lead Pipeline</span>
            <button onClick={() => onNavigate?.('leads')} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
              View all →
            </button>
          </div>
          <div className="card-body">
            {Object.entries(leads.byStatus || {}).map(([status, count]: any) => (
              <div key={status} style={{ marginBottom: 14 }}>
                <div className="flex justify-between" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>
                    {status.replace('_', ' ').toLowerCase()}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{count}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: `${Math.min(100, (count / (leads.total || 1)) * 100)}%`,
                    background: leadStatusColors[status] || 'var(--primary)'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Overview */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Revenue Overview</span>
            <button onClick={() => onNavigate?.('invoices')} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
              View invoices →
            </button>
          </div>
          <div className="card-body">
            {[
              { label: 'Total Invoiced', value: revenue.total, color: '#2563eb' },
              { label: 'Collected', value: revenue.collected, color: '#10b981' },
              { label: 'Outstanding', value: revenue.outstanding, color: '#f59e0b' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0', borderBottom: '1px solid var(--gray-100)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                  <span style={{ fontSize: 13 }}>{item.label}</span>
                </div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>${(item.value || 0).toLocaleString()}</span>
              </div>
            ))}
            <div style={{ marginTop: 16 }}>
              <div className="progress-bar" style={{ height: 10 }}>
                <div className="progress-fill" style={{
                  width: `${revenue.total > 0 ? Math.round((revenue.collected / revenue.total) * 100) : 0}%`
                }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4, textAlign: 'center' }}>
                {revenue.total > 0 ? Math.round((revenue.collected / revenue.total) * 100) : 0}% collected
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      {monthly?.months && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <span className="card-title">Revenue Trend — Last 12 Months</span>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--gray-500)' }}>
                <div style={{ width: 10, height: 10, background: '#2563eb', borderRadius: 2 }} /> Invoiced
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--gray-500)' }}>
                <div style={{ width: 10, height: 10, background: '#10b981', borderRadius: 2 }} /> Collected
              </div>
            </div>
          </div>
          <div style={{ padding: '8px 16px 16px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, minWidth: 600, height: 120 }}>
              {monthly.months.map((m: any, i: number) => {
                const revenueH = maxRevenue > 0 ? Math.max(2, (m.revenue / maxRevenue) * 100) : 2
                const collectedH = maxRevenue > 0 ? Math.max(0, (m.collected / maxRevenue) * 100) : 0
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{ fontSize: 9, color: 'var(--gray-400)', fontWeight: 500, marginBottom: 2, whiteSpace: 'nowrap' }}>
                      {m.revenue > 0 ? `$${(m.revenue / 1000).toFixed(0)}k` : ''}
                    </div>
                    <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', height: 90 }}>
                      <div style={{ flex: 1, height: `${revenueH}%`, background: '#2563eb', borderRadius: '3px 3px 0 0', minHeight: 2, opacity: 0.85 }} />
                      <div style={{ flex: 1, height: `${collectedH}%`, background: '#10b981', borderRadius: '3px 3px 0 0', minHeight: 0, opacity: 0.85 }} />
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--gray-500)', whiteSpace: 'nowrap', marginTop: 4 }}>{m.month}</div>
                    {m.bookings > 0 && (
                      <div style={{ fontSize: 9, color: 'var(--gray-400)' }}>{m.bookings}bk</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid-2" style={{ gap: 16, marginTop: 16 }}>
        {/* Recent Bookings */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Bookings</span>
            <button onClick={() => onNavigate?.('bookings')} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
              View all →
            </button>
          </div>
          {(!today?.recentBookings || today.recentBookings.length === 0) ? (
            <div className="card-body">
              <p style={{ color: 'var(--gray-400)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No bookings yet</p>
            </div>
          ) : (
            <div>
              {today.recentBookings.map((b: any) => (
                <div key={b.id} style={{
                  padding: '10px 16px', borderBottom: '1px solid var(--gray-100)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{b.customer?.firstName} {b.customer?.lastName}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{b.bookingNumber} · {b.destination || 'No destination'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{b.currency} {Number(b.totalAmount).toLocaleString()}</div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 6,
                      background: bookingStatusColors[b.status] + '20', color: bookingStatusColors[b.status]
                    }}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agent Performance */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Agent Performance</span>
          </div>
          <div className="card-body">
            {agents.length === 0 ? (
              <p style={{ color: 'var(--gray-400)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                No agents assigned yet
              </p>
            ) : agents.map((agent: any) => (
              <div key={agent.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderBottom: '1px solid var(--gray-100)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>
                    {agent.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <span style={{ fontSize: 13 }}>{agent.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="badge badge-green">{agent.bookings} bookings</span>
                  <span className="badge badge-blue">{agent.leads} leads</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lead Sources */}
      <div className="grid-2" style={{ gap: 16, marginTop: 16 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Lead Sources</span>
          </div>
          <div className="card-body">
            {Object.entries(leads.bySource || {}).length === 0 ? (
              <p style={{ color: 'var(--gray-400)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                No lead data yet
              </p>
            ) : Object.entries(leads.bySource || {}).map(([source, count]: any) => (
              <div key={source} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '8px 0', borderBottom: '1px solid var(--gray-100)'
              }}>
                <span style={{ fontSize: 13, textTransform: 'capitalize' }}>{source.replace('_', ' ').toLowerCase()}</span>
                <span className="badge badge-blue">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Status Overview */}
        {Object.keys(bookings.byStatus || {}).length > 0 && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Booking Status</span>
            </div>
            <div className="card-body" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {Object.entries(bookings.byStatus || {}).map(([status, count]: any) => (
                <div key={status} style={{
                  flex: '1 1 100px', background: 'var(--gray-50)', borderRadius: 10,
                  padding: '12px 14px', textAlign: 'center',
                  border: `2px solid ${bookingStatusColors[status] || '#e2e8f0'}`
                }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: bookingStatusColors[status] }}>
                    {count}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--gray-500)', marginTop: 4, textTransform: 'capitalize' }}>
                    {status.replace('_', ' ').toLowerCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
