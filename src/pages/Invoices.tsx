import { useState } from 'react'
import { useApi, useSubmit } from '../hooks/useApi'
import { Spinner, ErrorBox, Modal } from '../components/ui'
import { Plus, Search, DollarSign, CreditCard, Trash2, PlusCircle, Printer } from 'lucide-react'
import api from '../lib/api'

function printInvoice(inv: any) {
  const items = inv.items || []
  const html = `<!DOCTYPE html><html><head><title>${inv.invoiceNumber}</title><style>
    body{font-family:Arial,sans-serif;color:#1a1a2e;margin:0;padding:40px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px}
    .logo{font-size:22px;font-weight:800;color:#2563eb}
    .meta{text-align:right;font-size:13px;color:#64748b}
    .title{font-size:28px;font-weight:700;color:#2563eb;margin-bottom:4px}
    .section{margin-bottom:24px}
    .label{font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:4px}
    table{width:100%;border-collapse:collapse;margin-bottom:24px}
    th{background:#f8fafc;padding:10px 12px;text-align:left;font-size:12px;font-weight:700;color:#475569;border-bottom:2px solid #e2e8f0}
    td{padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px}
    .total-section{max-width:320px;margin-left:auto}
    .total-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #f1f5f9}
    .grand-total{font-size:16px;font-weight:800;color:#2563eb}
    .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}
    .status-PAID{background:#dcfce7;color:#16a34a}
    .status-OVERDUE{background:#fee2e2;color:#dc2626}
    .status-SENT{background:#dbeafe;color:#2563eb}
    .status-DRAFT{background:#f1f5f9;color:#64748b}
    @media print{body{padding:20px}}
  </style></head><body>
    <div class="header">
      <div>
        <div class="logo">Travel Agency CRM System</div>
        <div style="font-size:13px;color:#64748b;margin-top:6px">${inv.agency?.name || ''}</div>
        <div style="font-size:12px;color:#94a3b8">${inv.agency?.email || ''}</div>
      </div>
      <div class="meta">
        <div class="title">${inv.invoiceNumber}</div>
        <div>Issued: ${inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : new Date().toLocaleDateString()}</div>
        <div>Due: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</div>
        <div style="margin-top:8px"><span class="badge status-${inv.status}">${inv.status}</span></div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px">
      <div class="section"><div class="label">Bill To</div>
        <div style="font-weight:700;font-size:15px">${inv.customer?.firstName || ''} ${inv.customer?.lastName || ''}</div>
        <div style="font-size:13px;color:#64748b">${inv.customer?.email || ''}</div>
        <div style="font-size:13px;color:#64748b">${inv.customer?.phone || ''}</div>
      </div>
    </div>
    <table><thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr></thead>
      <tbody>${items.map((item: any) => `<tr>
        <td>${item.description}</td><td>${item.quantity}</td>
        <td>${inv.currency} ${Number(item.unitPrice).toLocaleString()}</td>
        <td>${inv.currency} ${(item.quantity * item.unitPrice).toLocaleString()}</td>
      </tr>`).join('')}</tbody>
    </table>
    <div class="total-section">
      <div class="total-row"><span>Subtotal</span><span>${inv.currency} ${Number(inv.subtotal).toLocaleString()}</span></div>
      ${Number(inv.discount) > 0 ? `<div class="total-row"><span>Discount</span><span>-${inv.currency} ${Number(inv.discount).toLocaleString()}</span></div>` : ''}
      ${Number(inv.tax) > 0 ? `<div class="total-row"><span>Tax</span><span>${inv.currency} ${Number(inv.tax).toLocaleString()}</span></div>` : ''}
      <div class="total-row grand-total"><span>Total</span><span>${inv.currency} ${Number(inv.total).toLocaleString()}</span></div>
      <div class="total-row" style="color:#16a34a"><span>Amount Paid</span><span>${inv.currency} ${Number(inv.amountPaid).toLocaleString()}</span></div>
      <div class="total-row" style="color:#dc2626;font-weight:700"><span>Balance Due</span><span>${inv.currency} ${Number(inv.amountDue).toLocaleString()}</span></div>
    </div>
    ${inv.notes ? `<div style="margin-top:32px;padding:16px;background:#f8fafc;border-radius:8px;font-size:13px"><b>Notes:</b> ${inv.notes}</div>` : ''}
    <script>window.onload=()=>{ window.print() }</script>
  </body></html>`
  const w = window.open('', '_blank')
  if (w) { w.document.write(html); w.document.close() }
}

const statusColor: Record<string, string> = {
  DRAFT: 'badge-gray', SENT: 'badge-blue', PARTIAL: 'badge-amber',
  PAID: 'badge-green', OVERDUE: 'badge-red', CANCELLED: 'badge-gray'
}

interface InvoiceItem { description: string; quantity: number; unitPrice: number }

const newItem = (): InvoiceItem => ({ description: '', quantity: 1, unitPrice: 0 })

export default function Invoices() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [form, setForm] = useState({
    customerId: '', bookingId: '', currency: 'USD',
    dueDate: '', discount: '0', tax: '0', notes: ''
  })
  const [items, setItems] = useState<InvoiceItem[]>([newItem()])
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'BANK_TRANSFER', reference: '', notes: '' })
  const { submit, submitting, error: submitError } = useSubmit()

  const url = `/invoices?${filterStatus !== 'all' ? `status=${filterStatus}&` : ''}`
  const { data: invoices, loading, error, refetch } = useApi<any[]>(url, [filterStatus])
  const { data: customersData } = useApi<any>('/customers?limit=200')
  const customers = customersData?.customers || []
  const { data: bookingsData } = useApi<any>('/bookings?limit=200')
  const bookings = bookingsData?.bookings || []

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const setP = (k: string, v: string) => setPaymentForm(f => ({ ...f, [k]: v }))

  const subtotal = items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0)
  const total = subtotal - Number(form.discount || 0) + Number(form.tax || 0)

  const updateItem = (idx: number, k: string, v: any) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [k]: v } : item))
  }

  const handleSave = async () => {
    const res = await submit(() => api.post('/invoices', { ...form, items }))
    if (res) { setShowModal(false); refetch() }
  }

  const handleStatusChange = async (id: string, status: string) => {
    await api.put(`/invoices/${id}`, { status })
    refetch()
  }

  const handlePayment = async () => {
    if (!selectedInvoice) return
    const res = await submit(() =>
      api.post(`/invoices/${selectedInvoice.id}/payments`, paymentForm)
    )
    if (res) { setShowPaymentModal(false); refetch() }
  }

  const handleStripePayment = async (invoice: any) => {
    try {
      const res = await api.post(`/invoices/${invoice.id}/stripe-payment`)
      window.open(res.data.url, '_blank')
    } catch (err: any) {
      alert(err.response?.data?.error || 'Stripe not configured')
    }
  }

  const filtered = (invoices || []).filter((inv: any) =>
    !search || inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <Spinner />
  if (error) return <ErrorBox message={error} />

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 items-center">
          <div className="search-bar">
            <Search size={15} className="search-icon" />
            <input className="form-input" placeholder="Search invoices..." value={search}
              onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
          </div>
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 130 }}>
            <option value="all">All Status</option>
            {['DRAFT','SENT','PARTIAL','PAID','OVERDUE','CANCELLED'].map(s =>
              <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setForm({ customerId: '', bookingId: '', currency: 'USD', dueDate: '', discount: '0', tax: '0', notes: '' })
          setItems([newItem()])
          setShowModal(true)
        }}><Plus size={15} /> New Invoice</button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state"><DollarSign size={40} /><p>No invoices yet</p></div>
                </td></tr>
              ) : filtered.map((inv: any) => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{inv.invoiceNumber}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{inv.customer?.firstName} {inv.customer?.lastName}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{inv.customer?.email}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{inv.currency} {Number(inv.total).toLocaleString()}</td>
                  <td style={{ color: 'var(--success)' }}>{inv.currency} {Number(inv.amountPaid).toLocaleString()}</td>
                  <td style={{ color: inv.amountDue > 0 ? 'var(--danger)' : 'var(--gray-500)', fontWeight: 500 }}>
                    {inv.currency} {Number(inv.amountDue).toLocaleString()}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <select value={inv.status}
                      onChange={e => handleStatusChange(inv.id, e.target.value)}
                      className={`badge ${statusColor[inv.status] || 'badge-gray'}`}
                      style={{ border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 11 }}>
                      {['DRAFT','SENT','PARTIAL','PAID','OVERDUE','CANCELLED'].map(s =>
                        <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-outline btn-sm" onClick={() => printInvoice(inv)} title="Print Invoice">
                        <Printer size={12} />
                      </button>
                      {inv.amountDue > 0 && (
                        <>
                          <button className="btn btn-outline btn-sm" onClick={() => {
                            setSelectedInvoice(inv)
                            setPaymentForm({ amount: String(inv.amountDue), method: 'BANK_TRANSFER', reference: '', notes: '' })
                            setShowPaymentModal(true)
                          }}>
                            + Payment
                          </button>
                          <button className="btn btn-sm" style={{ background: '#635bff', color: 'white', borderRadius: 6 }}
                            onClick={() => handleStripePayment(inv)}>
                            <CreditCard size={12} /> Stripe
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Invoice Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <span className="modal-title">New Invoice</span>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {submitError && <ErrorBox message={submitError} />}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Customer *</label>
                  <select className="form-select" value={form.customerId} onChange={e => set('customerId', e.target.value)}>
                    <option value="">Select customer...</option>
                    {customers.map((c: any) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Booking (optional)</label>
                  <select className="form-select" value={form.bookingId} onChange={e => set('bookingId', e.target.value)}>
                    <option value="">None</option>
                    {bookings.map((b: any) => <option key={b.id} value={b.id}>{b.bookingNumber} - {b.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select className="form-select" value={form.currency} onChange={e => set('currency', e.target.value)}>
                    {['USD','EUR','GBP','AED','SAR'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input type="date" className="form-input" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
                </div>
              </div>

              {/* Line Items */}
              <div style={{ marginBottom: 12 }}>
                <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
                  <label className="form-label" style={{ margin: 0 }}>Items</label>
                  <button className="btn btn-outline btn-sm" onClick={() => setItems([...items, newItem()])}>
                    <PlusCircle size={13} /> Add
                  </button>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'grid', gridTemplateColumns: '1fr 80px 120px 80px auto',
                    gap: 6, marginBottom: 6, alignItems: 'center'
                  }}>
                    <input className="form-input" placeholder="Description" value={item.description}
                      onChange={e => updateItem(idx, 'description', e.target.value)} />
                    <input type="number" className="form-input" placeholder="Qty" value={item.quantity}
                      onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} />
                    <input type="number" className="form-input" placeholder="Unit Price" value={item.unitPrice}
                      onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} />
                    <span style={{ fontWeight: 500, fontSize: 13, textAlign: 'right' }}>
                      {(item.quantity * item.unitPrice).toLocaleString()}
                    </span>
                    <button onClick={() => setItems(items.filter((_, i) => i !== idx))}
                      style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: 12 }}>
                <div className="flex justify-between" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 13 }}>Subtotal</span>
                  <span>{form.currency} {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 13 }}>Discount</span>
                  <input type="number" className="form-input" value={form.discount}
                    onChange={e => set('discount', e.target.value)} style={{ width: 100, textAlign: 'right' }} />
                </div>
                <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 13 }}>Tax</span>
                  <input type="number" className="form-input" value={form.tax}
                    onChange={e => set('tax', e.target.value)} style={{ width: 100, textAlign: 'right' }} />
                </div>
                <div className="flex justify-between" style={{ paddingTop: 8, borderTop: '1px solid var(--gray-200)' }}>
                  <span style={{ fontWeight: 700 }}>Total</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{form.currency} {total.toLocaleString()}</span>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 10 }}>
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <Modal title={`Record Payment — ${selectedInvoice?.invoiceNumber}`} onClose={() => setShowPaymentModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setShowPaymentModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePayment} disabled={submitting}>
                {submitting ? 'Recording...' : 'Record Payment'}
              </button>
            </>
          }>
          {submitError && <ErrorBox message={submitError} />}
          <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 16 }}>
            Amount Due: <strong>{selectedInvoice?.currency} {Number(selectedInvoice?.amountDue).toLocaleString()}</strong>
          </p>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount</label>
              <input type="number" className="form-input" value={paymentForm.amount}
                onChange={e => setP('amount', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Method</label>
              <select className="form-select" value={paymentForm.method} onChange={e => setP('method', e.target.value)}>
                {['CASH','BANK_TRANSFER','CREDIT_CARD','STRIPE','PAYPAL','CHECK','OTHER'].map(m =>
                  <option key={m} value={m}>{m.replace('_',' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Reference</label>
            <input className="form-input" value={paymentForm.reference} onChange={e => setP('reference', e.target.value)} placeholder="Transaction ID / Check number" />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={2} value={paymentForm.notes} onChange={e => setP('notes', e.target.value)} />
          </div>
        </Modal>
      )}
    </div>
  )
}
