import { useState, useRef } from 'react'
import { useApi, useSubmit } from '../hooks/useApi'
import { Spinner, ErrorBox, Modal } from '../components/ui'
import { Plus, Search, Users, Upload, FileText, Trash2, Download, FolderOpen } from 'lucide-react'
import api from '../lib/api'
import Pagination from '../components/Pagination'

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', phone: '', nationality: '',
  passportNumber: '', passportExpiry: '', dateOfBirth: '', address: '', notes: ''
}

const LIMIT = 15

export default function Customers() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [docsModal, setDocsModal] = useState<any>(null)
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
                      <div className="avatar">{getInitials(c.firstName, c.lastName)}</div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{c.firstName} {c.lastName}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                          {c.dateOfBirth ? `DOB: ${c.dateOfBirth}` : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>{c.email || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{c.phone}</div>
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
              {/* Upload area */}
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

              {/* Document list */}
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
