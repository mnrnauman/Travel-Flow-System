import { useState } from 'react'
import { useApi, useSubmit } from '../hooks/useApi'
import { Spinner, ErrorBox, Modal } from '../components/ui'
import { DollarSign, CheckCircle, Clock, Plus, Trash2, TrendingUp } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function Commissions() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const [filterAgent, setFilterAgent] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ bookingId: '', userId: '', amount: '', rate: '' })
  const { submit, submitting, error: submitError } = useSubmit()

  const endpoint = isAdmin
    ? `/commissions?${filterAgent !== 'all' ? `agentId=${filterAgent}&` : ''}${filterStatus !== 'all' ? `status=${filterStatus}` : ''}`
    : '/commissions/my'

  const { data, loading, error, refetch } = useApi<any>(endpoint, [filterAgent, filterStatus])
  const { data: usersData } = useApi<any[]>('/users')
  const { data: bookingsData } = useApi<any>('/bookings?limit=200')

  const commissions = data?.commissions || []
  const stats = data?.stats || { total: 0, pending: 0, paid: 0 }
  const agents = usersData || []
  const bookings = bookingsData?.bookings || []

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleMarkPaid = async (id: string) => {
    await api.put(`/commissions/${id}`, { status: 'paid' })
    refetch()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this commission entry?')) return
    await api.delete(`/commissions/${id}`)
    refetch()
  }

  const handleCreate = async () => {
    const res = await submit(async () => api.post('/commissions', form))
    if (res) { setShowCreate(false); setForm({ bookingId: '', userId: '', amount: '', rate: '' }); refetch() }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)

  if (loading) return <Spinner />
  if (error) return <ErrorBox message={error} />

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon blue"><DollarSign size={20} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Commissions</div>
            <div className="stat-value">{formatCurrency(stats.total)}</div>
            <div className="stat-change">All time</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><Clock size={20} /></div>
          <div className="stat-info">
            <div className="stat-label">Pending Payout</div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>{formatCurrency(stats.pending)}</div>
            <div className="stat-change">Awaiting payment</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle size={20} /></div>
          <div className="stat-info">
            <div className="stat-label">Paid Out</div>
            <div className="stat-value" style={{ color: '#16a34a' }}>{formatCurrency(isAdmin ? stats.paid : (stats.total - stats.pending))}</div>
            <div className="stat-change">Settled commissions</div>
          </div>
        </div>
        {isAdmin && (
          <div className="stat-card">
            <div className="stat-icon purple"><TrendingUp size={20} /></div>
            <div className="stat-info">
              <div className="stat-label">Pending Rate</div>
              <div className="stat-value" style={{ color: '#7c3aed' }}>
                {stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%
              </div>
              <div className="stat-change">Of total unpaid</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters + Actions */}
      <div className="flex justify-between items-center mb-4">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {isAdmin && (
            <select className="form-select" value={filterAgent} onChange={e => setFilterAgent(e.target.value)} style={{ width: 180 }}>
              <option value="all">All Agents</option>
              {agents.map((a: any) => (
                <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
              ))}
            </select>
          )}
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 140 }}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> Add Commission
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {isAdmin && <th>Agent</th>}
                <th>Booking</th>
                <th>Rate</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {commissions.length === 0 ? (
                <tr><td colSpan={isAdmin ? 7 : 5}>
                  <div className="empty-state">
                    <DollarSign size={40} />
                    <p>No commissions recorded yet.</p>
                    {isAdmin && <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>Add commissions when booking payments are received.</p>}
                  </div>
                </td></tr>
              ) : commissions.map((c: any) => (
                <tr key={c.id}>
                  {isAdmin && (
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>
                          {c.user?.firstName?.[0]}{c.user?.lastName?.[0]}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>
                          {c.user?.firstName} {c.user?.lastName}
                        </span>
                      </div>
                    </td>
                  )}
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: 13 }}>
                      {c.booking?.bookingNumber}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{c.booking?.title}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>{c.rate}%</td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: 14, color: c.status === 'paid' ? '#16a34a' : '#f59e0b' }}>
                      {formatCurrency(c.amount)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${c.status === 'paid' ? 'badge-green' : 'badge-amber'}`}>
                      {c.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                    </span>
                    {c.paidAt && (
                      <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 2 }}>
                        {new Date(c.paidAt).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  {isAdmin && (
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {c.status === 'pending' && (
                          <button className="btn btn-outline btn-sm"
                            style={{ borderColor: '#16a34a', color: '#16a34a', fontSize: 11 }}
                            onClick={() => handleMarkPaid(c.id)}>
                            Mark Paid
                          </button>
                        )}
                        <button className="btn btn-outline btn-sm"
                          style={{ borderColor: '#ef4444', color: '#ef4444' }}
                          onClick={() => handleDelete(c.id)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal
          title="Add Commission Entry"
          onClose={() => setShowCreate(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={submitting}>
                {submitting ? 'Saving...' : 'Add Commission'}
              </button>
            </>
          }
        >
          {submitError && <ErrorBox message={submitError} />}
          <div className="form-group">
            <label className="form-label">Booking *</label>
            <select className="form-select" value={form.bookingId} onChange={e => set('bookingId', e.target.value)} required>
              <option value="">Select booking...</option>
              {bookings.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.bookingNumber} — {b.customer?.firstName} {b.customer?.lastName} ({b.currency} {Number(b.totalAmount).toLocaleString()})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Agent *</label>
            <select className="form-select" value={form.userId} onChange={e => {
              const agent = agents.find((a: any) => a.id === e.target.value)
              const booking = bookings.find((b: any) => b.id === form.bookingId)
              const rate = agent?.commissionRate || 0
              const amount = booking ? ((Number(booking.totalAmount) * rate) / 100).toFixed(2) : ''
              setForm(f => ({ ...f, userId: e.target.value, rate: String(rate), amount }))
            }} required>
              <option value="">Select agent...</option>
              {agents.filter((a: any) => ['AGENT','MANAGER'].includes(a.role)).map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.firstName} {a.lastName} ({a.commissionRate}% rate)
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Commission Rate (%)</label>
              <input type="number" className="form-input" value={form.rate} min="0" max="100" step="0.1"
                onChange={e => {
                  const booking = bookings.find((b: any) => b.id === form.bookingId)
                  const amount = booking ? ((Number(booking.totalAmount) * Number(e.target.value)) / 100).toFixed(2) : form.amount
                  setForm(f => ({ ...f, rate: e.target.value, amount }))
                }} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Commission Amount *</label>
              <input type="number" className="form-input" value={form.amount} step="0.01" min="0"
                onChange={e => set('amount', e.target.value)} placeholder="0.00" required />
            </div>
          </div>
          <div style={{
            background: '#eff6ff', borderRadius: 8, padding: '10px 14px',
            fontSize: 12, color: '#2563eb', marginTop: 4
          }}>
            Selecting an agent auto-fills the commission rate and amount based on their rate.
          </div>
        </Modal>
      )}
    </div>
  )
}
