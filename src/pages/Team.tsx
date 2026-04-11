import { useState } from 'react'
import { useApi, useSubmit } from '../hooks/useApi'
import { Spinner, ErrorBox, Modal } from '../components/ui'
import { Plus, UserCog } from 'lucide-react'
import api from '../lib/api'

const ROLES = ['ADMIN', 'MANAGER', 'AGENT']
const roleColor: Record<string, string> = {
  SUPER_ADMIN: 'badge-red', ADMIN: 'badge-purple', MANAGER: 'badge-blue', AGENT: 'badge-green'
}

export default function Team() {
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '', phone: '',
    role: 'AGENT', commissionRate: '0'
  })
  const { submit, submitting, error: submitError } = useSubmit()
  const { data: users, loading, error, refetch } = useApi<any[]>('/users')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const openEdit = (u: any) => {
    setEditItem(u)
    setForm({
      email: u.email, password: '', firstName: u.firstName, lastName: u.lastName,
      phone: u.phone || '', role: u.role, commissionRate: String(u.commissionRate || 0)
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    const res = await submit(async () => {
      if (editItem) return api.put(`/users/${editItem.id}`, form)
      return api.post('/users', form)
    })
    if (res) { setShowModal(false); refetch() }
  }

  if (loading) return <Spinner />
  if (error) return <ErrorBox message={error} />

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
          {users?.length || 0} team members
        </div>
        <button className="btn btn-primary" onClick={() => {
          setEditItem(null)
          setForm({ email: '', password: '', firstName: '', lastName: '', phone: '', role: 'AGENT', commissionRate: '0' })
          setShowModal(true)
        }}><Plus size={15} /> Add Team Member</button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Commission</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!users || users.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state"><UserCog size={40} /><p>No team members</p></div>
                </td></tr>
              ) : users.map((u: any) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar">
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{u.firstName} {u.lastName}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{u.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{u.email}</td>
                  <td><span className={`badge ${roleColor[u.role] || 'badge-gray'}`}>{u.role}</span></td>
                  <td>{u.commissionRate}%</td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(u)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title={editItem ? 'Edit Team Member' : 'Add Team Member'} onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
                {submitting ? 'Saving...' : editItem ? 'Save Changes' : 'Add Member'}
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
              <label className="form-label">Email *</label>
              <input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
          </div>
          {!editItem && (
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input type="password" className="form-input" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="Initial password" />
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Commission Rate (%)</label>
              <input type="number" className="form-input" value={form.commissionRate}
                onChange={e => set('commissionRate', e.target.value)} min="0" max="100" step="0.5" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
