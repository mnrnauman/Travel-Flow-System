import { useState } from 'react'
import { useApi, useSubmit } from '../hooks/useApi'
import { Spinner, ErrorBox, Modal } from '../components/ui'
import { BookOpen, Search, Plus, Eye, Pencil } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

const statusColor: Record<string, string> = {
  DRAFT: 'badge-gray', CONFIRMED: 'badge-green', IN_PROGRESS: 'badge-amber',
  COMPLETED: 'badge-blue', CANCELLED: 'badge-red', REFUNDED: 'badge-gray'
}
const paymentColor: Record<string, string> = {
  UNPAID: 'badge-red', PARTIAL: 'badge-amber', PAID: 'badge-green',
  OVERDUE: 'badge-red', REFUNDED: 'badge-gray'
}

const STATUSES = ['DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
const PAYMENT_STATUSES = ['UNPAID', 'PARTIAL', 'PAID', 'OVERDUE']
const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'PKR', 'INR', 'CAD', 'AUD']

const emptyForm = {
  customerId: '', title: '', destination: '', departureDate: '', returnDate: '',
  numTravelers: '1', totalAmount: '', paidAmount: '0', currency: 'USD',
  status: 'CONFIRMED', paymentStatus: 'UNPAID', agentId: '', notes: ''
}

export default function Bookings() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPayment, setFilterPayment] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [viewItem, setViewItem] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const { submit, submitting, error: submitError } = useSubmit()

  const url = `/bookings?limit=100${filterStatus !== 'all' ? `&status=${filterStatus}` : ''}${filterPayment !== 'all' ? `&paymentStatus=${filterPayment}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`
  const { data, loading, error, refetch } = useApi<any>(url, [search, filterStatus, filterPayment])
  const { data: customers } = useApi<any>('/customers?limit=200')
  const { data: usersData } = useApi<any[]>('/users')

  const bookings = data?.bookings || []
  const customerList = customers?.customers || []
  const agents = (usersData || []).filter((u: any) => ['AGENT', 'MANAGER', 'ADMIN'].includes(u.role))

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const openCreate = () => {
    setEditItem(null)
    setForm({ ...emptyForm })
    setShowModal(true)
  }

  const openEdit = (b: any) => {
    setEditItem(b)
    setForm({
      customerId: b.customerId || '',
      title: b.title || '',
      destination: b.destination || '',
      departureDate: b.departureDate ? b.departureDate.slice(0, 10) : '',
      returnDate: b.returnDate ? b.returnDate.slice(0, 10) : '',
      numTravelers: String(b.numTravelers || 1),
      totalAmount: String(b.totalAmount || ''),
      paidAmount: String(b.paidAmount || 0),
      currency: b.currency || 'USD',
      status: b.status || 'CONFIRMED',
      paymentStatus: b.paymentStatus || 'UNPAID',
      agentId: b.agentId || '',
      notes: b.notes || ''
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    const payload = {
      ...form,
      numTravelers: Number(form.numTravelers),
      totalAmount: Number(form.totalAmount),
      paidAmount: Number(form.paidAmount),
      agentId: form.agentId || undefined,
    }
    const res = await submit(async () => {
      if (editItem) return api.put(`/bookings/${editItem.id}`, payload)
      return api.post('/bookings', payload)
    })
    if (res) { setShowModal(false); refetch() }
  }

  const handleStatusChange = async (id: string, status: string) => {
    await api.put(`/bookings/${id}`, { status })
    refetch()
  }

  if (loading) return <Spinner />
  if (error) return <ErrorBox message={error} />

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-bar">
            <Search size={15} className="search-icon" />
            <input className="form-input" placeholder="Search bookings..." value={search}
              onChange={e => setSearch(e.target.value)} style={{ width: 200 }} />
          </div>
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 140 }}>
            <option value="all">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select className="form-select" value={filterPayment} onChange={e => setFilterPayment(e.target.value)} style={{ width: 140 }}>
            <option value="all">All Payments</option>
            {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> New Booking
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: bookings.length, color: '#64748b' },
          { label: 'Confirmed', value: bookings.filter((b: any) => b.status === 'CONFIRMED').length, color: '#16a34a' },
          { label: 'In Progress', value: bookings.filter((b: any) => b.status === 'IN_PROGRESS').length, color: '#f59e0b' },
          { label: 'Unpaid', value: bookings.filter((b: any) => b.paymentStatus === 'UNPAID').length, color: '#ef4444' },
          { label: 'Total Value', value: `$${bookings.reduce((s: number, b: any) => s + Number(b.totalAmount), 0).toLocaleString()}`, color: '#2563eb' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'white', borderRadius: 8, padding: '8px 16px',
            border: `1px solid ${s.color}30`, display: 'flex', gap: 8, alignItems: 'center'
          }}>
            <span style={{ fontSize: 11, color: '#64748b' }}>{s.label}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Booking #</th>
                <th>Customer</th>
                <th>Trip</th>
                <th>Agent</th>
                <th>Dates</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr><td colSpan={9}>
                  <div className="empty-state"><BookOpen size={40} />
                    <p>No bookings yet.</p>
                    <button className="btn btn-primary" onClick={openCreate}><Plus size={14} /> Create First Booking</button>
                  </div>
                </td></tr>
              ) : bookings.map((b: any) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 13 }}>{b.bookingNumber}</td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{b.customer?.firstName} {b.customer?.lastName}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{b.customer?.email}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{b.title}</div>
                    {b.destination && <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{b.destination}</div>}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {b.agent ? `${b.agent.firstName} ${b.agent.lastName}` : '—'}
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--gray-500)' }}>
                    {b.departureDate ? new Date(b.departureDate).toLocaleDateString() : '—'}
                    {b.returnDate ? <><br />{new Date(b.returnDate).toLocaleDateString()}</> : ''}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{b.currency} {Number(b.totalAmount).toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: '#16a34a' }}>Paid: {Number(b.paidAmount).toLocaleString()}</div>
                  </td>
                  <td>
                    <span className={`badge ${paymentColor[b.paymentStatus] || 'badge-gray'}`}>
                      {b.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <select value={b.status}
                      onChange={e => handleStatusChange(b.id, e.target.value)}
                      className={`badge ${statusColor[b.status] || 'badge-gray'}`}
                      style={{ border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 11 }}>
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(b)} title="Edit">
                        <Pencil size={12} />
                      </button>
                      <span className="badge badge-gray" style={{ fontSize: 10 }}>
                        {b._count?.invoices || 0} inv
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <Modal
          title={editItem ? `Edit Booking — ${editItem.bookingNumber}` : 'New Booking'}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
                {submitting ? 'Saving...' : editItem ? 'Save Changes' : 'Create Booking'}
              </button>
            </>
          }
        >
          {submitError && <ErrorBox message={submitError} />}

          <div className="form-row">
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Trip Title *</label>
              <input className="form-input" value={form.title} required
                onChange={e => set('title', e.target.value)} placeholder="e.g. Dubai Family Package 2025" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Customer *</label>
              <select className="form-select" value={form.customerId}
                onChange={e => set('customerId', e.target.value)} required>
                <option value="">Select customer...</option>
                {customerList.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Assigned Agent</label>
              <select className="form-select" value={form.agentId} onChange={e => set('agentId', e.target.value)}>
                <option value="">Unassigned</option>
                {agents.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Destination</label>
              <input className="form-input" value={form.destination}
                onChange={e => set('destination', e.target.value)} placeholder="e.g. Dubai, UAE" />
            </div>
            <div className="form-group">
              <label className="form-label">No. of Travelers</label>
              <input type="number" className="form-input" value={form.numTravelers} min="1"
                onChange={e => set('numTravelers', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Departure Date</label>
              <input type="date" className="form-input" value={form.departureDate}
                onChange={e => set('departureDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Return Date</label>
              <input type="date" className="form-input" value={form.returnDate}
                onChange={e => set('returnDate', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select className="form-select" value={form.currency} onChange={e => set('currency', e.target.value)}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Total Amount *</label>
              <input type="number" className="form-input" value={form.totalAmount} min="0" step="0.01"
                onChange={e => set('totalAmount', e.target.value)} placeholder="0.00" required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount Paid</label>
              <input type="number" className="form-input" value={form.paidAmount} min="0" step="0.01"
                onChange={e => set('paidAmount', e.target.value)} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Status</label>
              <select className="form-select" value={form.paymentStatus} onChange={e => set('paymentStatus', e.target.value)}>
                {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Booking Status</label>
              <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" value={form.notes} rows={3}
              onChange={e => set('notes', e.target.value)} placeholder="Internal notes about this booking..." />
          </div>
        </Modal>
      )}
    </div>
  )
}
