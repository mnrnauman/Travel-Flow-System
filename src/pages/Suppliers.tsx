import { useState } from 'react'
import { useApi, useSubmit } from '../hooks/useApi'
import { Spinner, ErrorBox, Modal } from '../components/ui'
import { Plus, Search, Package, Star } from 'lucide-react'
import api from '../lib/api'

const TYPES = ['HOTEL', 'AIRLINE', 'TOUR_OPERATOR', 'TRANSFER', 'ACTIVITY', 'VISA', 'INSURANCE', 'OTHER']
const typeColor: Record<string, string> = {
  HOTEL: 'badge-blue', AIRLINE: 'badge-green', TOUR_OPERATOR: 'badge-purple',
  TRANSFER: 'badge-amber', ACTIVITY: 'badge-amber', VISA: 'badge-red',
  INSURANCE: 'badge-gray', OTHER: 'badge-gray'
}

const EMPTY_FORM = {
  name: '', type: 'HOTEL', email: '', phone: '', website: '',
  address: '', country: '', contactPerson: '', currency: 'USD',
  rating: '', notes: ''
}

export default function Suppliers() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const { submit, submitting, error: submitError } = useSubmit()

  const url = `/suppliers?${search ? `search=${encodeURIComponent(search)}&` : ''}${filterType !== 'all' ? `type=${filterType}&` : ''}`
  const { data: suppliers, loading, error, refetch } = useApi<any[]>(url, [search, filterType])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const openEdit = (s: any) => {
    setEditItem(s)
    setForm({
      name: s.name, type: s.type, email: s.email || '', phone: s.phone || '',
      website: s.website || '', address: s.address || '', country: s.country || '',
      contactPerson: s.contactPerson || '', currency: s.currency || 'USD',
      rating: s.rating || '', notes: s.notes || ''
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    const res = await submit(async () => {
      const data = { ...form, rating: form.rating ? Number(form.rating) : null }
      if (editItem) return api.put(`/suppliers/${editItem.id}`, data)
      return api.post('/suppliers', data)
    })
    if (res) { setShowModal(false); refetch() }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this supplier?')) return
    await api.delete(`/suppliers/${id}`)
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
            <input className="form-input" placeholder="Search suppliers..." value={search}
              onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
          </div>
          <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 150 }}>
            <option value="all">All Types</option>
            {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm(EMPTY_FORM); setShowModal(true) }}>
          <Plus size={15} /> Add Supplier
        </button>
      </div>

      <div className="grid-3" style={{ gap: 12 }}>
        {!suppliers || suppliers.length === 0 ? (
          <div className="card" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state"><Package size={40} /><p>No suppliers yet</p></div>
          </div>
        ) : suppliers.map((s: any) => (
          <div className="card" key={s.id}>
            <div style={{ padding: 16 }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 10 }}>
                <span className={`badge ${typeColor[s.type] || 'badge-gray'}`}>{s.type.replace('_', ' ')}</span>
                {s.rating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {Array.from({ length: s.rating }).map((_, i) => (
                      <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" />
                    ))}
                  </div>
                )}
              </div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{s.name}</div>
              {s.country && <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 2 }}>📍 {s.country}</div>}
              {s.contactPerson && <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 2 }}>👤 {s.contactPerson}</div>}
              {s.email && <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 2 }}>✉️ {s.email}</div>}
              {s.phone && <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>📞 {s.phone}</div>}
              {s.notes && <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 8, borderTop: '1px solid var(--gray-100)', paddingTop: 8 }}>{s.notes}</div>}
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--gray-100)', display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={() => openEdit(s)}>Edit</button>
              <button className="btn btn-sm" style={{ color: 'var(--danger)', border: '1px solid #fca5a5' }}
                onClick={() => handleDelete(s.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title={editItem ? 'Edit Supplier' : 'Add Supplier'} onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Supplier'}
              </button>
            </>
          }>
          {submitError && <ErrorBox message={submitError} />}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
                {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <input className="form-input" value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Rating (1-5)</label>
              <select className="form-select" value={form.rating} onChange={e => set('rating', e.target.value)}>
                <option value="">No rating</option>
                {[1,2,3,4,5].map(r => <option key={r} value={r}>{r} ⭐</option>)}
              </select>
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
              <label className="form-label">Country</label>
              <input className="form-input" value={form.country} onChange={e => set('country', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Website</label>
              <input className="form-input" value={form.website} onChange={e => set('website', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </Modal>
      )}
    </div>
  )
}
