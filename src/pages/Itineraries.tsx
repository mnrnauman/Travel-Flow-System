import { useState } from 'react'
import { useApi, useSubmit } from '../hooks/useApi'
import { Spinner, ErrorBox, Modal } from '../components/ui'
import { Plus, Search, Map, Trash2, PlusCircle, Link, Copy } from 'lucide-react'
import api from '../lib/api'

const ITEM_TYPES = ['FLIGHT', 'HOTEL', 'TRANSFER', 'ACTIVITY', 'MEAL', 'VISA', 'INSURANCE', 'OTHER']

interface ItineraryItem {
  type: string; dayNumber: number; title: string; description: string;
  location: string; checkIn: string; checkOut: string; duration: string;
  price: number; currency: string; notes: string
}
const newDayItem = (day: number): ItineraryItem => ({
  type: 'ACTIVITY', dayNumber: day, title: '', description: '',
  location: '', checkIn: '', checkOut: '', duration: '', price: 0, currency: 'USD', notes: ''
})

export default function Itineraries() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState({ title: '', destination: '', duration: '7', description: '' })
  const [items, setItems] = useState<ItineraryItem[]>([newDayItem(1)])
  const { submit, submitting, error: submitError } = useSubmit()

  const url = `/itineraries?${search ? `search=${encodeURIComponent(search)}` : ''}`
  const { data: itineraries, loading, error, refetch } = useApi<any[]>(url, [search])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = async () => {
    const res = await submit(() =>
      api.post('/itineraries', { ...form, duration: Number(form.duration) })
    )
    if (res) {
      setShowModal(false)
      setEditItem((res as any).data)
      setItems([newDayItem(1)])
      setShowBuilder(true)
      refetch()
    }
  }

  const handleSaveBuilder = async () => {
    if (!editItem) return
    const res = await submit(() =>
      api.put(`/itineraries/${editItem.id}`, { ...form, items })
    )
    if (res) { setShowBuilder(false); refetch() }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this itinerary?')) return
    await api.delete(`/itineraries/${id}`)
    refetch()
  }

  const openBuilder = async (itin: any) => {
    setEditItem(itin)
    setForm({ title: itin.title, destination: itin.destination, duration: String(itin.duration), description: itin.description || '' })
    try {
      const res = await api.get(`/itineraries/${itin.id}`)
      setItems(res.data.items?.length > 0 ? res.data.items : [newDayItem(1)])
    } catch {
      setItems([newDayItem(1)])
    }
    setShowBuilder(true)
  }

  const copyShareLink = (token: string) => {
    const url = `${window.location.origin}/itinerary/${token}`
    navigator.clipboard.writeText(url)
    alert('Share link copied!')
  }

  const updateItem = (idx: number, k: string, v: any) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [k]: v } : item))
  }

  const days = [...new Set(items.map(i => i.dayNumber))].sort((a, b) => a - b)

  if (loading) return <Spinner />
  if (error) return <ErrorBox message={error} />

  if (showBuilder) return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{form.title || 'New Itinerary'}</h2>
          <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>{form.destination} · {form.duration} days</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => setShowBuilder(false)}>← Back</button>
          <button className="btn btn-primary" onClick={handleSaveBuilder} disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Itinerary'}
          </button>
        </div>
      </div>
      {submitError && <ErrorBox message={submitError} />}

      {/* Day tabs */}
      <div className="flex gap-2" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        {Array.from({ length: Number(form.duration) || 7 }, (_, i) => i + 1).map(day => (
          <div key={day} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: days.includes(day) ? 'var(--primary-light)' : 'var(--gray-100)',
            borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 500
          }}>
            Day {day}
            <button onClick={() => setItems([...items, newDayItem(day)])}
              style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <PlusCircle size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Items by day */}
      {Array.from({ length: Number(form.duration) || 7 }, (_, i) => i + 1).map(day => {
        const dayItems = items.filter(it => it.dayNumber === day)
        if (dayItems.length === 0) return null
        return (
          <div key={day} className="card" style={{ marginBottom: 12 }}>
            <div className="card-header">
              <span className="card-title" style={{ color: 'var(--primary)' }}>Day {day}</span>
              <button className="btn btn-outline btn-sm" onClick={() => setItems([...items, newDayItem(day)])}>
                <PlusCircle size={13} /> Add Item
              </button>
            </div>
            <div style={{ padding: 16 }}>
              {dayItems.map((item, globalIdx) => {
                const idx = items.findIndex(it => it === item)
                return (
                  <div key={idx} style={{
                    background: 'var(--gray-50)', borderRadius: 8, padding: 12,
                    marginBottom: 8, border: '1px solid var(--gray-200)'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 8, marginBottom: 8 }}>
                      <select className="form-select" value={item.type}
                        onChange={e => updateItem(idx, 'type', e.target.value)}>
                        {ITEM_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                      <input className="form-input" placeholder="Title" value={item.title}
                        onChange={e => updateItem(idx, 'title', e.target.value)} />
                      <button onClick={() => setItems(items.filter((_, i) => i !== idx))}
                        style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <input className="form-input" placeholder="Location" value={item.location}
                          onChange={e => updateItem(idx, 'location', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <input type="number" className="form-input" placeholder="Price (USD)" value={item.price}
                          onChange={e => updateItem(idx, 'price', Number(e.target.value))} />
                      </div>
                    </div>
                    <textarea className="form-input" rows={2} placeholder="Description / Notes" value={item.description}
                      onChange={e => updateItem(idx, 'description', e.target.value)} />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <div style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: 13, padding: '20px 0' }}>
        Click the + button next to any day to add items
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="search-bar">
          <Search size={15} className="search-icon" />
          <input className="form-input" placeholder="Search itineraries..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ width: 260 }} />
        </div>
        <button className="btn btn-primary" onClick={() => {
          setForm({ title: '', destination: '', duration: '7', description: '' })
          setShowModal(true)
        }}><Plus size={15} /> New Itinerary</button>
      </div>

      <div className="grid-3" style={{ gap: 12 }}>
        {!itineraries || itineraries.length === 0 ? (
          <div className="card" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state"><Map size={40} /><p>No itineraries yet</p></div>
          </div>
        ) : itineraries.map((itin: any) => (
          <div className="card" key={itin.id}>
            <div style={{ padding: 16 }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
                <span className="badge badge-blue">{itin.duration} days</span>
                <button onClick={() => copyShareLink(itin.shareToken)}
                  style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                  <Link size={12} /> Share
                </button>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{itin.title}</div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 8 }}>📍 {itin.destination}</div>
              {itin.description && (
                <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 8 }}>
                  {itin.description.slice(0, 80)}...
                </div>
              )}
              <div className="flex gap-2" style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                <span>{itin._count?.items || 0} items</span>
                <span>·</span>
                <span>{itin._count?.quotations || 0} quotations</span>
              </div>
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--gray-100)', display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => openBuilder(itin)}>
                Open Builder
              </button>
              <button className="btn btn-sm" style={{ color: 'var(--danger)', border: '1px solid #fca5a5' }}
                onClick={() => handleDelete(itin.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title="New Itinerary" onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create & Open Builder'}
              </button>
            </>
          }>
          {submitError && <ErrorBox message={submitError} />}
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. 7-Day Japan Adventure" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Destination</label>
              <input className="form-input" value={form.destination} onChange={e => set('destination', e.target.value)}
                placeholder="e.g. Tokyo, Japan" />
            </div>
            <div className="form-group">
              <label className="form-label">Duration (days)</label>
              <input type="number" className="form-input" value={form.duration} onChange={e => set('duration', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
        </Modal>
      )}
    </div>
  )
}
