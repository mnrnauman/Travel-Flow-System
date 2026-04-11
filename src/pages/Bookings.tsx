import { useState } from 'react'
import { useApi, useSubmit } from '../hooks/useApi'
import { Spinner, ErrorBox } from '../components/ui'
import { BookOpen, Search } from 'lucide-react'
import api from '../lib/api'

const statusColor: Record<string, string> = {
  DRAFT: 'badge-gray', CONFIRMED: 'badge-green', IN_PROGRESS: 'badge-amber',
  COMPLETED: 'badge-blue', CANCELLED: 'badge-red', REFUNDED: 'badge-gray'
}
const paymentColor: Record<string, string> = {
  UNPAID: 'badge-red', PARTIAL: 'badge-amber', PAID: 'badge-green',
  OVERDUE: 'badge-red', REFUNDED: 'badge-gray'
}

export default function Bookings() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPayment, setFilterPayment] = useState('all')

  const url = `/bookings?limit=100${filterStatus !== 'all' ? `&status=${filterStatus}` : ''}${filterPayment !== 'all' ? `&paymentStatus=${filterPayment}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`
  const { data, loading, error, refetch } = useApi<any>(url, [search, filterStatus, filterPayment])
  const bookings = data?.bookings || []

  const handleStatusChange = async (id: string, status: string) => {
    await api.put(`/bookings/${id}`, { status })
    refetch()
  }

  if (loading) return <Spinner />
  if (error) return <ErrorBox message={error} />

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 items-center">
          <div className="search-bar">
            <Search size={15} className="search-icon" />
            <input className="form-input" placeholder="Search bookings..." value={search}
              onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
          </div>
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 140 }}>
            <option value="all">All Status</option>
            {['DRAFT','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED'].map(s =>
              <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
          <select className="form-select" value={filterPayment} onChange={e => setFilterPayment(e.target.value)} style={{ width: 140 }}>
            <option value="all">All Payments</option>
            {['UNPAID','PARTIAL','PAID','OVERDUE'].map(s =>
              <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
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
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state"><BookOpen size={40} />
                    <p>No bookings yet. Convert a quotation to create a booking.</p>
                  </div>
                </td></tr>
              ) : bookings.map((b: any) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{b.bookingNumber}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{b.customer?.firstName} {b.customer?.lastName}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{b.customer?.email}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>{b.title}</div>
                    {b.departureDate && (
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                        {new Date(b.departureDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {b.agent ? `${b.agent.firstName} ${b.agent.lastName}` : '—'}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{b.currency} {Number(b.totalAmount).toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                      Paid: {Number(b.paidAmount).toLocaleString()}
                    </div>
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
                      {['DRAFT','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED'].map(s =>
                        <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                    </select>
                  </td>
                  <td>
                    <span className="badge badge-gray" style={{ fontSize: 11 }}>
                      {b._count?.invoices || 0} invoices
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
