import { useState, useRef } from 'react'
import { useApi, useSubmit } from '../hooks/useApi'
import { Spinner, ErrorBox, Modal } from '../components/ui'
import { Plus, Search, Users, Trash2, FolderOpen, MessageCircle, Eye, X, Download, FileText, Upload, CreditCard, Briefcase } from 'lucide-react'
import api from '../lib/api'
import Pagination from '../components/Pagination'

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', phone: '', nationality: '',
  passportNumber: '', passportExpiry: '', dateOfBirth: '', address: '', notes: ''
}

const LIMIT = 15

function CustomerDetailPanel({ customer, onClose }: { customer: any; onClose: () => void }) {
  const { data: detail, loading } = useApi<any>(`/customers/${customer.id}`, [customer.id])

  const totalSpend = (detail?.invoices || []).reduce((s: number, inv: any) => s + Number(inv.amountPaid || 0), 0)
  const totalOwed = (detail?.invoices || []).reduce((s: number, inv: any) => s + Number(inv.amountDue || 0), 0)
  const currency = detail?.invoices?.[0]?.currency || 'USD'

  const passportExpiry = customer.passportExpiry ? new Date(customer.passportExpiry) : null
  const today = new Date()
  const daysToExpiry = passportExpiry ? Math.ceil((passportExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end'
    }} onClick={onClose}>
      <div style={{
        width: 480, height: '100vh', background: 'white', boxShadow: '-4px 0 30px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary)', color: 'white' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{customer.firstName} {customer.lastName}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>{customer.email || customer.phone || 'No contact info'}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: 'white', padding: 6, borderRadius: 6 }}>
            <X size={16} />
          </button>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: 'var(--gray-200)' }}>
          {[
            { label: 'Bookings', value: loading ? '…' : (detail?.bookings?.length ?? 0), icon: '✈️' },
            { label: 'Paid', value: loading ? '…' : `${currency} ${totalSpend.toLocaleString()}`, icon: '💰' },
            { label: 'Outstanding', value: loading ? '…' : `${currency} ${totalOwed.toLocaleString()}`, icon: '📋' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 18 }}>{s.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-900)' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div>
          ) : (
            <>
              {/* Customer Info */}
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--gray-100)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.05em' }}>Customer Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {customer.nationality && <div style={{ fontSize: 12 }}><span style={{ color: 'var(--gray-400)' }}>Nationality: </span>{customer.nationality}</div>}
                  {customer.dateOfBirth && <div style={{ fontSize: 12 }}><span style={{ color: 'var(--gray-400)' }}>DOB: </span>{customer.dateOfBirth?.slice(0, 10)}</div>}
                  {customer.passportNumber && <div style={{ fontSize: 12 }}><span style={{ color: 'var(--gray-400)' }}>Passport: </span>{customer.passportNumber}</div>}
                  {passportExpiry && (
                    <div style={{ fontSize: 12 }}>
                      <span style={{ color: 'var(--gray-400)' }}>Expiry: </span>
                      <span style={{ color: daysToExpiry !== null && daysToExpiry < 90 ? 'var(--danger)' : 'inherit', fontWeight: daysToExpiry !== null && daysToExpiry < 90 ? 600 : 400 }}>
                        {passportExpiry.toLocaleDateString()}
                        {daysToExpiry !== null && daysToExpiry < 90 && ` (${daysToExpiry}d)`}
                      </span>
                    </div>
                  )}
                  {customer.phone && (
                    <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <a href={`tel:${customer.phone}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{customer.phone}</a>
                      <a href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#25d366', display: 'flex' }}><MessageCircle size={12} /></a>
                    </div>
                  )}
                  {customer.address && <div style={{ fontSize: 12, gridColumn: 'span 2' }}><span style={{ color: 'var(--gray-400)' }}>Address: </span>{customer.address}</div>}
                </div>
              </div>

              {/* Bookings */}
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--gray-100)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Briefcase size={11} /> Bookings ({(detail?.bookings || []).length})
                </div>
                {(detail?.bookings || []).length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', padding: '8px 0' }}>No bookings yet</div>
                ) : (detail?.bookings || []).map((b: any) => (
                  <div key={b.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--gray-50)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>{b.bookingNumber}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>{b.title}</div>
                      {b.departureDate && <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Dep: {new Date(b.departureDate).toLocaleDateString()}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{b.currency} {Number(b.totalAmount).toLocaleString()}</div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                        background: b.status === 'CONFIRMED' ? '#d1fae5' : b.status === 'CANCELLED' ? '#fee2e2' : '#dbeafe',
                        color: b.status === 'CONFIRMED' ? '#065f46' : b.status === 'CANCELLED' ? '#991b1b' : '#1d4ed8'
                      }}>{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Invoices */}
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--gray-100)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CreditCard size={11} /> Invoices ({(detail?.invoices || []).length})
                </div>
                {(detail?.invoices || []).length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', padding: '8px 0' }}>No invoices yet</div>
                ) : (detail?.invoices || []).map((inv: any) => (
                  <div key={inv.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--gray-50)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>{inv.invoiceNumber}</div>
                      {inv.dueDate && <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Due: {new Date(inv.dueDate).toLocaleDateString()}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{inv.currency} {Number(inv.total).toLocaleString()}</div>
                      {Number(inv.amountDue) > 0 && <div style={{ fontSize: 11, color: 'var(--danger)' }}>Due: {inv.currency} {Number(inv.amountDue).toLocaleString()}</div>}
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                        background: inv.status === 'PAID' ? '#d1fae5' : inv.status === 'OVERDUE' ? '#fee2e2' : '#fef3c7',
                        color: inv.status === 'PAID' ? '#065f46' : inv.status === 'OVERDUE' ? '#991b1b' : '#92400e'
                      }}>{inv.status}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Linked Leads */}
              {(detail?.leads || []).length > 0 && (
                <div style={{ padding: '14px 20px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.05em' }}>Linked Leads</div>
                  {(detail?.leads || []).map((lead: any) => (
                    <div key={lead.id} style={{ padding: '6px 0', fontSize: 12 }}>
                      <span style={{ fontWeight: 500 }}>{lead.destination || 'No destination'}</span>
                      <span style={{ color: 'var(--gray-400)', marginLeft: 8 }}>{lead.source?.replace('_', ' ')} · {lead.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Customers() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [docsModal, setDocsModal] = useState<any>(null)
  const [detailCustomer, setDetailCustomer] = useState<any>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const { submit, submitting, error: submitError } = useSubmit()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [docName, setDocName] = useState('')

  const url = `/customers?${search ? `search=${encodeURIComponent(search)}&` : ''}limit=${LIMIT}&offset=${(page - 1) * LIMIT}`
  const { data, loading, error, refetch } = useApi<any>(url, [search, page])
  const customers = data?.customers || []
  const total = data?.total || 0

  const docsUrl = docsModal ? `/uploads?customerId=${docsModal.id}` : null
  const { data: docs, refetch: refetchDocs } = useApi<any[]>(docsUrl || '/uploads?customerId=_', [docsModal?.id])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const openEdit = (c: any) => {
    setEditItem(c)
    setForm({
      firstName: c.firstName, lastName: c.lastName, email: c.email || '',
      phone: c.phone || '', nationality: c.nationality || '',
      passportNumber: c.passportNumber || '', passportExpiry: c.passportExpiry?.slice(0, 10) || '',
      dateOfBirth: c.dateOfBirth?.slice(0, 10) || '', address: c.address || '', notes: c.notes || ''
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    const res = await submit(async () => {
      if (editItem) return api.put(`/customers/${editItem.id}`, form)
      return api.post('/customers', form)
    })
    if (res) { setShowModal(false); refetch() }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer and all their records?')) return
    await api.delete(`/customers/${id}`)
    refetch()
  }

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file || !docsModal) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('customerId', docsModal.id)
    fd.append('name', docName || file.name)
    try {
      await api.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setDocName('')
      if (fileRef.current) fileRef.current.value = ''
      refetchDocs()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Delete this document?')) return
    await api.delete(`/uploads/${docId}`)
    refetchDocs()
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getInitials = (first: string, last: string) =>
    `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase()

  if (loading) return <Spinner />
  if (error) return <ErrorBox message={error} />

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="search-bar">
          <Search size={15} className="search-icon" />
          <input className="form-input" placeholder="Search customers..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }} style={{ width: 260 }} />
        </div>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm(EMPTY_FORM); setShowModal(true) }}>
          <Plus size={15} /> Add Customer
        </button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Nationality</th>
                <th>Passport</th>
                <th>Bookings</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state"><Users size={40} /><p>No customers yet</p></div>
                </td></tr>
              ) : customers.map((c: any) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ cursor: 'pointer' }} onClick={() => setDetailCustomer(c)}>{getInitials(c.firstName, c.lastName)}</div>
                      <div>
                        <div style={{ fontWeight: 500, cursor: 'pointer', color: 'var(--primary)' }} onClick={() => setDetailCustomer(c)}>
                          {c.firstName} {c.lastName}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                          {c.dateOfBirth ? `DOB: ${c.dateOfBirth}` : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>{c.email || '—'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{c.phone || '—'}</span>
                      {c.phone && (
                        <a href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank" rel="noopener noreferrer"
                          title="WhatsApp"
                          style={{ color: '#25d366', lineHeight: 1, display: 'flex' }}
                          onClick={e => e.stopPropagation()}>
                          <MessageCircle size={13} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td>{c.nationality || '—'}</td>
                  <td>
                    {c.passportNumber ? (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{c.passportNumber}</div>
                        {c.passportExpiry && (
                          <div style={{ fontSize: 11, color: new Date(c.passportExpiry) < new Date() ? 'var(--danger)' : 'var(--gray-400)' }}>
                            Exp: {c.passportExpiry?.slice(0, 10)}
                          </div>
                        )}
                      </div>
                    ) : <span style={{ color: 'var(--gray-300)', fontSize: 12 }}>—</span>}
                  </td>
                  <td><span className="badge badge-blue">{c._count?.bookings || 0}</span></td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-outline btn-sm" onClick={() => setDetailCustomer(c)} title="View full profile">
                        <Eye size={12} />
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(c)}>Edit</button>
                      <button className="btn btn-outline btn-sm" onClick={() => setDocsModal(c)} title="Documents">
                        <FolderOpen size={12} />
                      </button>
                      <button className="btn btn-sm" style={{ color: 'var(--danger)', border: '1px solid #fca5a5' }}
                        onClick={() => handleDelete(c.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '0 16px' }}>
          <Pagination page={page} total={total} limit={LIMIT} onPage={setPage} />
        </div>
      </div>

      {/* Customer Detail Slide-over */}
      {detailCustomer && (
        <CustomerDetailPanel customer={detailCustomer} onClose={() => setDetailCustomer(null)} />
      )}

      {/* Edit/Add Customer Modal */}
      {showModal && (
        <Modal title={editItem ? 'Edit Customer' : 'Add Customer'} onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
                {submitting ? 'Saving...' : editItem ? 'Save Changes' : 'Add Customer'}
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
              <label className="form-label">Last Name *</label>
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
              <label className="form-label">Nationality</label>
              <input className="form-input" value={form.nationality} onChange={e => set('nationality', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input type="date" className="form-input" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Passport Number</label>
              <input className="form-input" value={form.passportNumber} onChange={e => set('passportNumber', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Passport Expiry</label>
              <input type="date" className="form-input" value={form.passportExpiry} onChange={e => set('passportExpiry', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </Modal>
      )}

      {/* Documents Modal */}
      {docsModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDocsModal(null)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <span className="modal-title"><FolderOpen size={16} /> Documents — {docsModal.firstName} {docsModal.lastName}</span>
              <button className="btn-icon" onClick={() => setDocsModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--gray-50)', borderRadius: 10, padding: 16, marginBottom: 16, border: '1px dashed var(--gray-300)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Upload size={14} /> Upload Document
                </div>
                <div className="form-group" style={{ marginBottom: 8 }}>
                  <input className="form-input" placeholder="Document name (optional)" value={docName}
                    onChange={e => setDocName(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    style={{ fontSize: 12, flex: 1 }} />
                  <button className="btn btn-primary btn-sm" onClick={handleUpload} disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 6 }}>
                  Accepted: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX (max 10 MB)
                </div>
              </div>

              {(docs || []).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gray-400)' }}>
                  <FileText size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                  <div style={{ fontSize: 13 }}>No documents uploaded yet</div>
                </div>
              ) : (docs || []).map((doc: any) => (
                <div key={doc.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 0', borderBottom: '1px solid var(--gray-100)'
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, background: '#eff6ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <FileText size={16} color="#2563eb" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                      {formatSize(doc.size)} · {new Date(doc.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer"
                    className="btn btn-outline btn-sm" style={{ flexShrink: 0 }}>
                    <Download size={12} />
                  </a>
                  <button className="btn btn-sm btn-icon" onClick={() => handleDeleteDoc(doc.id)}
                    style={{ color: 'var(--danger)', border: '1px solid #fca5a5', flexShrink: 0 }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
