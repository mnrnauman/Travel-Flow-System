import { useState, useCallback } from 'react'
import { useApi, useSubmit } from '../hooks/useApi'
import { Spinner, ErrorBox, Modal } from '../components/ui'
import { Plus, Search, X, TrendingUp, Phone, Mail, Calendar } from 'lucide-react'
import api from '../lib/api'
import Pagination from '../components/Pagination'

const LIMIT = 20

const STATUS_OPTIONS = ['NEW', 'CONTACTED', 'PROPOSAL_SENT', 'NEGOTIATING', 'BOOKED', 'LOST']
const SOURCE_OPTIONS = ['WEBSITE', 'WHATSAPP', 'PHONE', 'EMAIL', 'REFERRAL', 'WALK_IN', 'SOCIAL_MEDIA', 'OTHER']

const statusColor: Record<string, string> = {
  NEW: 'badge-blue', CONTACTED: 'badge-amber', PROPOSAL_SENT: 'badge-purple',
  NEGOTIATING: 'badge-amber', BOOKED: 'badge-green', LOST: 'badge-red'
}

const statusBg: Record<string, string> = {
  NEW: '#dbeafe', CONTACTED: '#fef3c7', PROPOSAL_SENT: '#ede9fe',
  NEGOTIATING: '#ffedd5', BOOKED: '#d1fae5', LOST: '#fee2e2'
}

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', phone: '', source: 'WEBSITE',
  destination: '', travelDates: '', numTravelers: '', budget: '', currency: 'USD', notes: ''
}

export default function Leads() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [page, setPage] = useState(1)
  const { submit, submitting, error: submitError } = useSubmit()

  const url = `/leads?${search ? `search=${encodeURIComponent(search)}&` : ''}${filterStatus !== 'all' ? `status=${filterStatus}&` : ''}limit=${viewMode === 'kanban' ? 200 : LIMIT}&offset=${(page - 1) * LIMIT}`
  const { data, loading, error, refetch } = useApi<any>(url, [search, filterStatus, page, viewMode])

  const leads = data?.leads || []
  const total = data?.total || 0

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const openAdd = () => {
    setEditItem(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (lead: any) => {
    setEditItem(lead)
    setForm({
      firstName: lead.firstName, lastName: lead.lastName, email: lead.email || '',
      phone: lead.phone || '', source: lead.source, destination: lead.destination || '',
      travelDates: lead.travelDates || '', numTravelers: lead.numTravelers || '',
      budget: lead.budget || '', currency: lead.currency || 'USD', notes: lead.notes || ''
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    const res = await submit(async () => {
      if (editItem) {
        return api.put(`/leads/${editItem.id}`, form)
      } else {
        return api.post('/leads', form)
      }
    })
    if (res) { setShowModal(false); refetch() }
  }

  const handleStatusChange = async (leadId: string, status: string) => {
    await api.put(`/leads/${leadId}`, { status })
    refetch()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lead?')) return
    await api.delete(`/leads/${id}`)
    refetch()
  }

  const grouped = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = leads.filter((l: any) => l.status === s)
    return acc
  }, {} as Record<string, any[]>)

  if (loading) return <Spinner />
  if (error) return <ErrorBox message={error} />

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 items-center">
          <div className="search-bar">
            <Search size={15} className="search-icon" />
            <input className="form-input" placeholder="Search leads..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }} style={{ width: 220 }} />
          </div>
          <select className="form-select" value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1) }} style={{ width: 140 }}>
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 0, border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
            {(['list', 'kanban'] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)} style={{
                padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                background: viewMode === v ? 'var(--primary)' : 'white',
                color: viewMode === v ? 'white' : 'var(--gray-600)', border: 'none'
              }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> New Lead</button>
      </div>

      {viewMode === 'list' ? (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Contact</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr><td colSpan={7}>
                    <div className="empty-state"><TrendingUp size={40} /><p>No leads yet. Add your first lead!</p></div>
                  </td></tr>
                ) : leads.map((lead: any) => (
                  <tr key={lead.id}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--gray-900)' }}>
                        {lead.firstName} {lead.lastName}
                      </div>
                      {lead.assignedTo && (
                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                          Agent: {lead.assignedTo.firstName}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: 12 }}>{lead.email}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{lead.phone}</div>
                    </td>
                    <td>
                      <span className="badge badge-gray">{lead.source?.replace('_', ' ')}</span>
                    </td>
                    <td style={{ fontSize: 12 }}>{lead.destination || '—'}</td>
                    <td style={{ fontSize: 12 }}>
                      {lead.budget ? `${lead.currency} ${Number(lead.budget).toLocaleString()}` : '—'}
                    </td>
                    <td>
                      <select value={lead.status}
                        onChange={e => handleStatusChange(lead.id, e.target.value)}
                        className={`badge ${statusColor[lead.status]}`}
                        style={{ border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 11 }}>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(lead)}>Edit</button>
                        <button className="btn btn-sm" style={{ color: 'var(--danger)', border: '1px solid #fca5a5' }}
                          onClick={() => handleDelete(lead.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '0 16px' }}>
            <Pagination page={page} total={total} limit={LIMIT} onPage={p => { setPage(p); window.scrollTo(0, 0) }} />
          </div>
        </div>
      ) : (
        /* Kanban View */
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
          {STATUS_OPTIONS.map(status => (
            <div key={status} style={{
              minWidth: 250, background: 'var(--gray-50)', borderRadius: 12,
              border: '1px solid var(--gray-200)', padding: 12
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', textTransform: 'capitalize' }}>
                  {status.replace('_', ' ')}
                </span>
                <span style={{
                  background: statusBg[status], fontSize: 11, fontWeight: 700,
                  padding: '2px 7px', borderRadius: 10, color: 'var(--gray-700)'
                }}>
                  {grouped[status]?.length || 0}
                </span>
              </div>
              {(grouped[status] || []).map((lead: any) => (
                <div key={lead.id} style={{
                  background: 'white', borderRadius: 8, padding: 12,
                  border: '1px solid var(--gray-200)', marginBottom: 8,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                    {lead.firstName} {lead.lastName}
                  </div>
                  {lead.destination && (
                    <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 2 }}>
                      ✈️ {lead.destination}
                    </div>
                  )}
                  {lead.budget && (
                    <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 6 }}>
                      💰 {lead.currency} {Number(lead.budget).toLocaleString()}
                    </div>
                  )}
                  {lead.source && (
                    <span className="badge badge-gray" style={{ fontSize: 10 }}>
                      {lead.source.replace('_', ' ')}
                    </span>
                  )}
                  <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                    <button className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}
                      onClick={() => openEdit(lead)}>Edit</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editItem ? 'Edit Lead' : 'New Lead'} onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
                {submitting ? 'Saving...' : editItem ? 'Save Changes' : 'Create Lead'}
              </button>
            </>
          }>
          {submitError && <ErrorBox message={submitError} />}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input className="form-input" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input className="form-input" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Source</label>
              <select className="form-select" value={form.source} onChange={e => set('source', e.target.value)}>
                {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Destination</label>
              <input className="form-input" value={form.destination} onChange={e => set('destination', e.target.value)} placeholder="e.g. Tokyo, Japan" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Travel Dates</label>
              <input className="form-input" value={form.travelDates} onChange={e => set('travelDates', e.target.value)} placeholder="e.g. June 10-20, 2026" />
            </div>
            <div className="form-group">
              <label className="form-label">No. of Travelers</label>
              <input type="number" className="form-input" value={form.numTravelers} onChange={e => set('numTravelers', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Budget</label>
              <input type="number" className="form-input" value={form.budget} onChange={e => set('budget', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select className="form-select" value={form.currency} onChange={e => set('currency', e.target.value)}>
                {['USD', 'EUR', 'GBP', 'AED', 'SAR', 'JPY', 'AUD', 'CAD'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </Modal>
      )}
    </div>
  )
}
