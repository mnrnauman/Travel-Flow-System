import { useState, useCallback } from 'react'
import { useApi, useSubmit } from '../hooks/useApi'
import { Spinner, ErrorBox, Modal } from '../components/ui'
import { Plus, Search, TrendingUp, Phone, MessageSquare, ChevronRight, Clock, Send, X, UserPlus } from 'lucide-react'
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
  destination: '', travelDates: '', numTravelers: '', budget: '', currency: 'USD',
  notes: '', assignedToId: '', followUpDate: ''
}

const ACTIVITY_TYPE_ICONS: Record<string, string> = {
  created: '✨', status_change: '🔄', note: '📝', call: '📞', email: '📧', meeting: '🤝', whatsapp: '💬'
}

const ACTIVITY_TYPES = ['note', 'call', 'email', 'whatsapp', 'meeting']

function LeadActivityPanel({ lead, onClose }: { lead: any; onClose: () => void }) {
  const { data: detail, loading, refetch } = useApi<any>(`/leads/${lead.id}`)
  const [noteText, setNoteText] = useState('')
  const [noteType, setNoteType] = useState('note')
  const [saving, setSaving] = useState(false)

  const addNote = async () => {
    if (!noteText.trim()) return
    setSaving(true)
    try {
      await api.post(`/leads/${lead.id}/activities`, { type: noteType, note: noteText.trim() })
      setNoteText('')
      refetch()
    } catch {}
    setSaving(false)
  }

  const activities = detail?.activities || []

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end'
    }} onClick={onClose}>
      <div style={{
        width: 400, height: '100vh', background: 'white', boxShadow: '-4px 0 30px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{lead.firstName} {lead.lastName}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{lead.destination || lead.email || 'No destination'}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '12px 20px', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {lead.phone && (
              <a href={`tel:${lead.phone}`} style={{ fontSize: 12, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                <Phone size={11} /> {lead.phone}
              </a>
            )}
            {lead.phone && (
              <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer"
                style={{ fontSize: 12, color: '#25d366', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                <MessageSquare size={11} /> WhatsApp
              </a>
            )}
            {lead.travelDates && (
              <span style={{ fontSize: 12, color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={11} /> {lead.travelDates}
              </span>
            )}
            {lead.budget && (
              <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                Budget: {lead.currency} {Number(lead.budget).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activity Log</div>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: 13, padding: '20px 0' }}>Loading...</div>
          ) : activities.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: 13, padding: '20px 0' }}>No activity yet</div>
          ) : activities.map((act: any) => (
            <div key={act.id} style={{ marginBottom: 12, display: 'flex', gap: 10 }}>
              <div style={{ fontSize: 16, marginTop: 1, flexShrink: 0 }}>
                {ACTIVITY_TYPE_ICONS[act.type] || '📝'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--gray-800)', lineHeight: 1.4 }}>{act.note}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 3 }}>
                  {act.type.replace('_', ' ')} · {new Date(act.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--gray-200)' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {ACTIVITY_TYPES.map(t => (
              <button key={t} onClick={() => setNoteType(t)} style={{
                padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: 'none',
                background: noteType === t ? 'var(--primary)' : 'var(--gray-100)',
                color: noteType === t ? 'white' : 'var(--gray-600)'
              }}>
                {ACTIVITY_TYPE_ICONS[t]} {t}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Add a note, call log, or update..."
              style={{
                flex: 1, resize: 'none', border: '1px solid var(--gray-200)',
                borderRadius: 8, padding: '8px 10px', fontSize: 13,
                fontFamily: 'inherit', outline: 'none', minHeight: 60
              }}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addNote() }}
            />
            <button onClick={addNote} disabled={saving || !noteText.trim()} style={{
              width: 36, height: 36, borderRadius: 8, background: 'var(--primary)', color: 'white',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              alignSelf: 'flex-end', opacity: !noteText.trim() ? 0.5 : 1
            }}>
              <Send size={14} />
            </button>
          </div>
          <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 4 }}>Ctrl+Enter to save</div>
        </div>
      </div>
    </div>
  )
}

export default function Leads() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [page, setPage] = useState(1)
  const [activityLead, setActivityLead] = useState<any>(null)
  const [converting, setConverting] = useState<string | null>(null)
  const { submit, submitting, error: submitError } = useSubmit()

  const url = `/leads?${search ? `search=${encodeURIComponent(search)}&` : ''}${filterStatus !== 'all' ? `status=${filterStatus}&` : ''}limit=${viewMode === 'kanban' ? 200 : LIMIT}&offset=${(page - 1) * LIMIT}`
  const { data, loading, error, refetch } = useApi<any>(url, [search, filterStatus, page, viewMode])
  const { data: usersData } = useApi<any[]>('/users')
  const users = usersData || []

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
      budget: lead.budget || '', currency: lead.currency || 'USD', notes: lead.notes || '',
      assignedToId: lead.assignedTo?.id || '',
      followUpDate: lead.followUpDate?.slice(0, 10) || ''
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

  const handleConvertToCustomer = async (lead: any) => {
    if (!confirm(`Convert "${lead.firstName} ${lead.lastName}" to a customer? This will create a new customer record.`)) return
    setConverting(lead.id)
    try {
      const res = await api.post(`/customers/from-lead/${lead.id}`)
      alert(`Customer created: ${res.data.firstName} ${res.data.lastName}`)
      refetch()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Conversion failed')
    } finally {
      setConverting(null)
    }
  }

  const grouped = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = leads.filter((l: any) => l.status === s)
    return acc
  }, {} as Record<string, any[]>)

  const makeWhatsAppUrl = (phone: string) => {
    const digits = phone.replace(/[^0-9]/g, '')
    return `https://wa.me/${digits}`
  }

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
                      {lead.followUpDate && (
                        <div style={{ fontSize: 10, color: new Date(lead.followUpDate) < new Date() ? 'var(--danger)' : 'var(--gray-400)', marginTop: 1 }}>
                          Follow-up: {new Date(lead.followUpDate).toLocaleDateString()}
                        </div>
                      )}
                      {lead.activities?.[0] && (
                        <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 2, fontStyle: 'italic', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {lead.activities[0].note}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: 12 }}>{lead.email}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        {lead.phone && (
                          <>
                            <a href={`tel:${lead.phone}`} style={{ fontSize: 11, color: 'var(--gray-500)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Phone size={10} /> {lead.phone}
                            </a>
                            <a href={makeWhatsAppUrl(lead.phone)} target="_blank" rel="noreferrer"
                              title="WhatsApp"
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: 4, background: '#25d36615', color: '#25d366', textDecoration: 'none' }}
                              onClick={e => e.stopPropagation()}>
                              <MessageSquare size={10} />
                            </a>
                          </>
                        )}
                      </div>
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
                      <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => setActivityLead(lead)}
                          title="View activities & notes" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ChevronRight size={12} /> Notes
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(lead)}>Edit</button>
                        {lead.status === 'BOOKED' && !lead.customer && (
                          <button
                            className="btn btn-sm"
                            style={{ background: '#10b981', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
                            onClick={() => handleConvertToCustomer(lead)}
                            disabled={converting === lead.id}
                            title="Convert to Customer">
                            <UserPlus size={11} /> {converting === lead.id ? '…' : 'Convert'}
                          </button>
                        )}
                        {lead.customer && (
                          <span style={{ fontSize: 10, color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                            ✓ Customer
                          </span>
                        )}
                        <button className="btn btn-sm" style={{ color: 'var(--danger)', border: '1px solid #fca5a5' }}
                          onClick={() => handleDelete(lead.id)}>Del</button>
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
                    <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 4 }}>
                      💰 {lead.currency} {Number(lead.budget).toLocaleString()}
                    </div>
                  )}
                  {lead.assignedTo && (
                    <div style={{ fontSize: 10, color: 'var(--gray-400)', marginBottom: 4 }}>
                      👤 {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                    </div>
                  )}
                  {lead.phone && (
                    <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                      <a href={`tel:${lead.phone}`} style={{ fontSize: 10, color: 'var(--gray-500)', textDecoration: 'none' }}><Phone size={9} /> {lead.phone}</a>
                      <a href={makeWhatsAppUrl(lead.phone)} target="_blank" rel="noreferrer"
                        style={{ fontSize: 10, color: '#25d366', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <MessageSquare size={9} /> WA
                      </a>
                    </div>
                  )}
                  {lead.source && (
                    <span className="badge badge-gray" style={{ fontSize: 10 }}>
                      {lead.source.replace('_', ' ')}
                    </span>
                  )}
                  <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <button className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}
                      onClick={() => setActivityLead(lead)}>Notes</button>
                    <button className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}
                      onClick={() => openEdit(lead)}>Edit</button>
                    {lead.status === 'BOOKED' && !lead.customer && (
                      <button className="btn btn-sm" style={{ background: '#10b981', color: 'white', border: 'none', fontSize: 10, display: 'flex', alignItems: 'center', gap: 2 }}
                        onClick={() => handleConvertToCustomer(lead)} disabled={converting === lead.id}>
                        <UserPlus size={10} /> Convert
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {activityLead && (
        <LeadActivityPanel lead={activityLead} onClose={() => setActivityLead(null)} />
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
              <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 234 567 890" />
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
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Assign To Agent</label>
              <select className="form-select" value={form.assignedToId} onChange={e => set('assignedToId', e.target.value)}>
                <option value="">Unassigned</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Follow-up Date</label>
              <input type="date" className="form-input" value={form.followUpDate} onChange={e => set('followUpDate', e.target.value)} />
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
