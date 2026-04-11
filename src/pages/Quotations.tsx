import { useState } from 'react'
import { useApi, useSubmit } from '../hooks/useApi'
import { Spinner, ErrorBox, Modal } from '../components/ui'
import { Plus, Search, FileText, Trash2, PlusCircle, Printer } from 'lucide-react'
import api from '../lib/api'

function printQuotation(q: any) {
  const items = q.items || []
  const html = `<!DOCTYPE html><html><head><title>${q.quoteNumber}</title><style>
    body{font-family:Arial,sans-serif;color:#1a1a2e;margin:0;padding:40px}
    .logo{font-size:22px;font-weight:800;color:#2563eb}
    table{width:100%;border-collapse:collapse;margin-bottom:24px}
    th{background:#f8fafc;padding:10px 12px;text-align:left;font-size:12px;font-weight:700;color:#475569;border-bottom:2px solid #e2e8f0}
    td{padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px}
    .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}
    .status-DRAFT{background:#f1f5f9;color:#64748b} .status-SENT{background:#dbeafe;color:#2563eb}
    .status-ACCEPTED{background:#dcfce7;color:#16a34a} .status-REJECTED{background:#fee2e2;color:#dc2626}
    .total-section{max-width:320px;margin-left:auto}
    .total-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #f1f5f9}
    .grand-total{font-size:16px;font-weight:800;color:#2563eb}
    @media print{body{padding:20px}}
  </style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px">
      <div><div class="logo">GCIT Travel Agency CRM</div></div>
      <div style="text-align:right">
        <div style="font-size:26px;font-weight:800;color:#2563eb">${q.quoteNumber}</div>
        <div style="font-size:13px;color:#64748b">QUOTATION</div>
        ${q.validUntil ? `<div style="font-size:12px;color:#94a3b8;margin-top:4px">Valid until: ${new Date(q.validUntil).toLocaleDateString()}</div>` : ''}
        <div style="margin-top:8px"><span class="badge status-${q.status}">${q.status}</span></div>
      </div>
    </div>
    <div style="margin-bottom:28px">
      <div style="font-size:18px;font-weight:700">${q.title}</div>
      ${q.lead ? `<div style="font-size:13px;color:#64748b;margin-top:4px">Lead: ${q.lead.firstName} ${q.lead.lastName}</div>` : ''}
    </div>
    <table><thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr></thead>
      <tbody>${items.map((item: any) => `<tr>
        <td>${item.description}</td><td>${item.quantity}</td>
        <td>${q.currency} ${Number(item.unitPrice).toLocaleString()}</td>
        <td>${q.currency} ${(item.quantity * item.unitPrice).toLocaleString()}</td>
      </tr>`).join('')}</tbody>
    </table>
    <div class="total-section">
      <div class="total-row"><span>Subtotal</span><span>${q.currency} ${Number(q.subtotal).toLocaleString()}</span></div>
      ${Number(q.discount) > 0 ? `<div class="total-row"><span>Discount</span><span>-${q.currency} ${Number(q.discount).toLocaleString()}</span></div>` : ''}
      ${Number(q.tax) > 0 ? `<div class="total-row"><span>Tax</span><span>${q.currency} ${Number(q.tax).toLocaleString()}</span></div>` : ''}
      <div class="total-row grand-total"><span>Total</span><span>${q.currency} ${Number(q.total).toLocaleString()}</span></div>
    </div>
    ${q.notes ? `<div style="margin-top:32px;padding:16px;background:#f8fafc;border-radius:8px;font-size:13px"><b>Notes:</b> ${q.notes}</div>` : ''}
    <script>window.onload=()=>{ window.print() }</script>
  </body></html>`
  const w = window.open('', '_blank')
  if (w) { w.document.write(html); w.document.close() }
}

const statusColor: Record<string, string> = {
  DRAFT: 'badge-gray', SENT: 'badge-blue', ACCEPTED: 'badge-green',
  REJECTED: 'badge-red', EXPIRED: 'badge-amber'
}

interface QuoteItem {
  description: string; type: string; quantity: number; unitPrice: number; notes: string; sortOrder: number
}

const newItem = (): QuoteItem => ({ description: '', type: 'service', quantity: 1, unitPrice: 0, notes: '', sortOrder: 0 })

export default function Quotations() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [selectedQ, setSelectedQ] = useState<any>(null)
  const [form, setForm] = useState({
    title: '', currency: 'USD', validUntil: '', discount: '0', tax: '0', notes: ''
  })
  const [items, setItems] = useState<QuoteItem[]>([newItem()])
  const [convertForm, setConvertForm] = useState({ customerId: '', departureDate: '', returnDate: '' })
  const { submit, submitting, error: submitError } = useSubmit()

  const url = `/quotations?${filterStatus !== 'all' ? `status=${filterStatus}&` : ''}`
  const { data: quotations, loading, error, refetch } = useApi<any[]>(url, [filterStatus])
  const { data: customersData } = useApi<any>('/customers?limit=200')
  const customers = customersData?.customers || []

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const subtotal = items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0)
  const total = subtotal - Number(form.discount || 0) + Number(form.tax || 0)

  const updateItem = (idx: number, k: string, v: any) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [k]: v } : item))
  }

  const handleSave = async () => {
    const res = await submit(() =>
      api.post('/quotations', { ...form, items })
    )
    if (res) { setShowModal(false); refetch() }
  }

  const handleStatusChange = async (id: string, status: string) => {
    await api.put(`/quotations/${id}`, { status })
    refetch()
  }

  const handleConvert = async () => {
    if (!selectedQ || !convertForm.customerId) return
    const res = await submit(() =>
      api.post(`/quotations/${selectedQ.id}/convert`, convertForm)
    )
    if (res) { setShowConvertModal(false); refetch() }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this quotation?')) return
    await api.delete(`/quotations/${id}`)
    refetch()
  }

  const filtered = (quotations || []).filter((q: any) =>
    !search || q.title?.toLowerCase().includes(search.toLowerCase()) ||
    q.quoteNumber?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <Spinner />
  if (error) return <ErrorBox message={error} />

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 items-center">
          <div className="search-bar">
            <Search size={15} className="search-icon" />
            <input className="form-input" placeholder="Search quotations..." value={search}
              onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
          </div>
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 130 }}>
            <option value="all">All Status</option>
            {['DRAFT','SENT','ACCEPTED','REJECTED','EXPIRED'].map(s =>
              <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setForm({ title: '', currency: 'USD', validUntil: '', discount: '0', tax: '0', notes: '' })
          setItems([newItem()])
          setShowModal(true)
        }}><Plus size={15} /> New Quotation</button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Quote #</th>
                <th>Title</th>
                <th>Lead</th>
                <th>Created By</th>
                <th>Total</th>
                <th>Valid Until</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state"><FileText size={40} /><p>No quotations yet</p></div>
                </td></tr>
              ) : filtered.map((q: any) => (
                <tr key={q.id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{q.quoteNumber}</td>
                  <td style={{ fontWeight: 500 }}>{q.title}</td>
                  <td style={{ fontSize: 12 }}>
                    {q.lead ? `${q.lead.firstName} ${q.lead.lastName}` : '—'}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {q.createdBy ? `${q.createdBy.firstName} ${q.createdBy.lastName}` : '—'}
                  </td>
                  <td style={{ fontWeight: 600 }}>{q.currency} {Number(q.total).toLocaleString()}</td>
                  <td style={{ fontSize: 12 }}>
                    {q.validUntil ? new Date(q.validUntil).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <select value={q.status}
                      onChange={e => handleStatusChange(q.id, e.target.value)}
                      className={`badge ${statusColor[q.status] || 'badge-gray'}`}
                      style={{ border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 11 }}>
                      {['DRAFT','SENT','ACCEPTED','REJECTED','EXPIRED'].map(s =>
                        <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-outline btn-sm" onClick={() => printQuotation(q)} title="Print Quotation">
                        <Printer size={12} />
                      </button>
                      {q.status === 'ACCEPTED' && !q.booking && (
                        <button className="btn btn-success btn-sm"
                          onClick={() => { setSelectedQ(q); setConvertForm({ customerId: '', departureDate: '', returnDate: '' }); setShowConvertModal(true) }}>
                          Convert
                        </button>
                      )}
                      <button className="btn btn-sm" style={{ color: 'var(--danger)', border: '1px solid #fca5a5' }}
                        onClick={() => handleDelete(q.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Quotation Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <span className="modal-title">New Quotation</span>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {submitError && <ErrorBox message={submitError} />}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select className="form-select" value={form.currency} onChange={e => set('currency', e.target.value)}>
                    {['USD','EUR','GBP','AED','SAR','JPY'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Valid Until</label>
                  <input type="date" className="form-input" value={form.validUntil} onChange={e => set('validUntil', e.target.value)} />
                </div>
              </div>

              {/* Line Items */}
              <div style={{ marginBottom: 16 }}>
                <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
                  <label className="form-label" style={{ margin: 0 }}>Line Items</label>
                  <button className="btn btn-outline btn-sm" onClick={() => setItems([...items, newItem()])}>
                    <PlusCircle size={13} /> Add Item
                  </button>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} style={{
                    background: 'var(--gray-50)', borderRadius: 8,
                    padding: 12, marginBottom: 8, border: '1px solid var(--gray-200)'
                  }}>
                    <div className="form-row" style={{ marginBottom: 6 }}>
                      <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                        <input className="form-input" placeholder="Description" value={item.description}
                          onChange={e => updateItem(idx, 'description', e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 120px 1fr auto', gap: 8 }}>
                      <input type="number" className="form-input" placeholder="Qty" value={item.quantity}
                        onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} />
                      <input type="number" className="form-input" placeholder="Unit Price" value={item.unitPrice}
                        onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} />
                      <div style={{ display: 'flex', alignItems: 'center', fontWeight: 600, fontSize: 14 }}>
                        {form.currency} {(item.quantity * item.unitPrice).toLocaleString()}
                      </div>
                      <button onClick={() => setItems(items.filter((_, i) => i !== idx))}
                        style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: 14 }}>
                <div className="flex justify-between" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 13 }}>Subtotal</span>
                  <span style={{ fontWeight: 500 }}>{form.currency} {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 13 }}>Discount</span>
                  <input type="number" className="form-input" value={form.discount}
                    onChange={e => set('discount', e.target.value)}
                    style={{ width: 100, textAlign: 'right' }} />
                </div>
                <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 13 }}>Tax</span>
                  <input type="number" className="form-input" value={form.tax}
                    onChange={e => set('tax', e.target.value)}
                    style={{ width: 100, textAlign: 'right' }} />
                </div>
                <div className="flex justify-between" style={{ paddingTop: 8, borderTop: '1px solid var(--gray-200)' }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Total</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--primary)' }}>
                    {form.currency} {total.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Quotation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Booking Modal */}
      {showConvertModal && (
        <Modal title="Convert to Booking" onClose={() => setShowConvertModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setShowConvertModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleConvert} disabled={submitting}>
                {submitting ? 'Converting...' : 'Create Booking'}
              </button>
            </>
          }>
          {submitError && <ErrorBox message={submitError} />}
          <div className="form-group">
            <label className="form-label">Customer *</label>
            <select className="form-select" value={convertForm.customerId}
              onChange={e => setConvertForm(f => ({ ...f, customerId: e.target.value }))}>
              <option value="">Select customer...</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Departure Date</label>
              <input type="date" className="form-input" value={convertForm.departureDate}
                onChange={e => setConvertForm(f => ({ ...f, departureDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Return Date</label>
              <input type="date" className="form-input" value={convertForm.returnDate}
                onChange={e => setConvertForm(f => ({ ...f, returnDate: e.target.value }))} />
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>
            Quotation total: <strong>{selectedQ?.currency} {Number(selectedQ?.total).toLocaleString()}</strong>
          </p>
        </Modal>
      )}
    </div>
  )
}
