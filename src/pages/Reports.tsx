import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { Spinner, ErrorBox } from '../components/ui'
import { BarChart3, Download, TrendingUp, Users, DollarSign, Target } from 'lucide-react'
import api from '../lib/api'

export default function Reports() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const { data: stats, loading, error } = useApi<any>('/reports/dashboard')
  const { data: salesData, loading: salesLoading } = useApi<any>(
    `/reports/sales?${from ? `from=${from}&` : ''}${to ? `to=${to}` : ''}`,
    [from, to]
  )

  if (loading) return <Spinner />
  if (error) return <ErrorBox message={error} />
  if (!stats) return null

  const { leads, customers, bookings, revenue } = stats

  return (
    <div>
      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">From Date</label>
            <input type="date" className="form-input" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">To Date</label>
            <input type="date" className="form-input" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <button className="btn btn-outline" style={{ marginTop: 20 }}
            onClick={() => { setFrom(''); setTo('') }}>
            Clear
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon blue"><TrendingUp size={20} /></div>
          <div className="stat-info">
            <div className="stat-label">Lead Conversion</div>
            <div className="stat-value">{leads.conversionRate}%</div>
            <div className="stat-change">{leads.converted} / {leads.total} leads</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Users size={20} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Customers</div>
            <div className="stat-value">{customers.total}</div>
            <div className="stat-change">All time</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><DollarSign size={20} /></div>
          <div className="stat-info">
            <div className="stat-label">Revenue Collected</div>
            <div className="stat-value">${(revenue.collected || 0).toLocaleString()}</div>
            <div className="stat-change">${(revenue.outstanding || 0).toLocaleString()} outstanding</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><Target size={20} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Bookings</div>
            <div className="stat-value">{bookings.total}</div>
            <div className="stat-change">{bookings.thisMonth} this month</div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 16 }}>
        {/* Lead by Status */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Leads by Status</span>
          </div>
          <div className="card-body">
            {Object.entries(leads.byStatus || {}).map(([status, count]: any) => (
              <div key={status} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderBottom: '1px solid var(--gray-100)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: status === 'BOOKED' ? '#10b981' : status === 'LOST' ? '#ef4444' : '#3b82f6'
                  }} />
                  <span style={{ fontSize: 13, textTransform: 'capitalize' }}>
                    {status.replace('_', ' ').toLowerCase()}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: Math.max(20, (count / (leads.total || 1)) * 120),
                    height: 8, background: '#dbeafe', borderRadius: 99, overflow: 'hidden'
                  }}>
                    <div style={{
                      width: '100%', height: '100%',
                      background: status === 'BOOKED' ? '#10b981' : status === 'LOST' ? '#ef4444' : '#3b82f6'
                    }} />
                  </div>
                  <span style={{ fontWeight: 600, minWidth: 24, fontSize: 13 }}>{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Sources */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Lead Sources</span>
          </div>
          <div className="card-body">
            {Object.entries(leads.bySource || {}).length === 0 ? (
              <p style={{ color: 'var(--gray-400)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No data</p>
            ) : Object.entries(leads.bySource || {}).map(([source, count]: any) => (
              <div key={source} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderBottom: '1px solid var(--gray-100)'
              }}>
                <span style={{ fontSize: 13, textTransform: 'capitalize' }}>
                  {source.replace('_', ' ').toLowerCase()}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{count}</span>
                  <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                    ({Math.round((count / (leads.total || 1)) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Performance */}
      {stats.agents?.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <span className="card-title">Agent Performance</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Bookings</th>
                  <th>Leads Assigned</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                {stats.agents.map((agent: any) => (
                  <tr key={agent.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar">{agent.name.split(' ').map((n: string) => n[0]).join('')}</div>
                        <span style={{ fontWeight: 500 }}>{agent.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-green">{agent.bookings}</span>
                    </td>
                    <td>
                      <span className="badge badge-blue">{agent.leads}</span>
                    </td>
                    <td>
                      <div className="progress-bar" style={{ width: 100 }}>
                        <div className="progress-fill" style={{
                          width: `${Math.min(100, (agent.bookings / Math.max(1, bookings.total)) * 100)}%`
                        }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      {salesData?.bookings?.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <span className="card-title">Booking Sales Report</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Booking #</th>
                  <th>Customer</th>
                  <th>Agent</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {salesData.bookings.slice(0, 20).map((b: any) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{b.bookingNumber}</td>
                    <td>{b.customer?.firstName} {b.customer?.lastName}</td>
                    <td>{b.agent ? `${b.agent.firstName} ${b.agent.lastName}` : '—'}</td>
                    <td style={{ fontWeight: 600 }}>{b.currency} {Number(b.totalAmount).toLocaleString()}</td>
                    <td style={{ fontSize: 12 }}>{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td><span className="badge badge-green">{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
