import { useApi } from '../hooks/useApi'
import { Spinner, ErrorBox } from '../components/ui'
import {
  TrendingUp, Users, BookOpen, DollarSign, Target,
  ArrowUpRight, AlertCircle, CheckCircle, Clock
} from 'lucide-react'

export default function Dashboard() {
  const { data: stats, loading, error } = useApi<any>('/reports/dashboard')

  if (loading) return <Spinner />
  if (error) return <ErrorBox message={error} />
  if (!stats) return null

  const { leads, customers, bookings, revenue, agents } = stats

  const statCards = [
    { label: 'Total Leads', value: leads.total, sub: `+${leads.thisMonth} this month`, icon: TrendingUp, color: 'blue' },
    { label: 'Customers', value: customers.total, sub: 'Registered', icon: Users, color: 'green' },
    { label: 'Bookings', value: bookings.total, sub: `+${bookings.thisMonth} this month`, icon: BookOpen, color: 'amber' },
    { label: 'Total Revenue', value: `$${(revenue.total || 0).toLocaleString()}`, sub: `$${(revenue.outstanding || 0).toLocaleString()} outstanding`, icon: DollarSign, color: 'purple' },
    { label: 'Conversion Rate', value: `${leads.conversionRate}%`, sub: `${leads.converted} converted`, icon: Target, color: 'green' },
    { label: 'Collected', value: `$${(revenue.collected || 0).toLocaleString()}`, sub: `of $${(revenue.total || 0).toLocaleString()}`, icon: CheckCircle, color: 'blue' },
  ]

  const leadStatusColors: Record<string, string> = {
    NEW: '#3b82f6', CONTACTED: '#f59e0b', PROPOSAL_SENT: '#8b5cf6',
    NEGOTIATING: '#f97316', BOOKED: '#10b981', LOST: '#ef4444'
  }

  const bookingStatusColors: Record<string, string> = {
    CONFIRMED: '#10b981', IN_PROGRESS: '#f59e0b', COMPLETED: '#6366f1',
    CANCELLED: '#ef4444', DRAFT: '#94a3b8'
  }

  return (
    <div>
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

      <div className="grid-2" style={{ gap: 16 }}>
        {/* Lead Pipeline */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Lead Pipeline</span>
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

        {/* Revenue Breakdown */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Revenue Overview</span>
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

      <div className="grid-2" style={{ gap: 16, marginTop: 16 }}>
        {/* Lead Sources */}
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

        {/* Top Agents */}
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

      {/* Booking Status */}
      {Object.keys(bookings.byStatus || {}).length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <span className="card-title">Booking Status Overview</span>
          </div>
          <div className="card-body" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {Object.entries(bookings.byStatus || {}).map(([status, count]: any) => (
              <div key={status} style={{
                flex: '1 1 120px', background: 'var(--gray-50)', borderRadius: 10,
                padding: '14px 16px', textAlign: 'center',
                border: `2px solid ${bookingStatusColors[status] || '#e2e8f0'}`
              }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: bookingStatusColors[status] }}>
                  {count}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 4, textTransform: 'capitalize' }}>
                  {status.replace('_', ' ').toLowerCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
