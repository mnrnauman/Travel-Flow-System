import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Save, Lock, User, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import api from '../lib/api'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [tab, setTab] = useState<'info' | 'password'>('info')
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const setPw = (k: string, v: string) => setPwForm(f => ({ ...f, [k]: v }))

  const handleSaveProfile = async () => {
    setSaving(true); setMsg(null)
    try {
      const r = await api.put('/auth/profile', form)
      if (setUser) setUser(r.data.user)
      setMsg({ type: 'success', text: 'Profile updated successfully!' })
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!pwForm.newPassword || pwForm.newPassword !== pwForm.confirmPassword) {
      return setMsg({ type: 'error', text: 'New passwords do not match' })
    }
    if (pwForm.newPassword.length < 6) {
      return setMsg({ type: 'error', text: 'Password must be at least 6 characters' })
    }
    setSaving(true); setMsg(null)
    try {
      await api.put('/auth/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      setMsg({ type: 'success', text: 'Password changed successfully!' })
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to change password' })
    } finally {
      setSaving(false)
    }
  }

  const initials = `${form.firstName?.[0] || ''}${form.lastName?.[0] || ''}`

  return (
    <div style={{ maxWidth: 600 }}>
      {msg && (
        <div style={{
          padding: '12px 16px', borderRadius: 8, marginBottom: 16,
          background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${msg.type === 'success' ? '#86efac' : '#fca5a5'}`,
          color: msg.type === 'success' ? '#16a34a' : '#dc2626',
          display: 'flex', alignItems: 'center', gap: 8, fontSize: 14
        }}>
          {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </div>
      )}

      {/* Avatar section */}
      <div className="card" style={{ padding: '24px 28px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 700, color: 'white'
        }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{form.firstName} {form.lastName}</div>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>{user?.email}</div>
          <div style={{ marginTop: 6 }}>
            <span style={{
              padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: '#eff6ff', color: '#1d4ed8', textTransform: 'uppercase'
            }}>
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', background: 'var(--gray-50)' }}>
          {[
            { id: 'info', label: 'Personal Info', icon: User },
            { id: 'password', label: 'Change Password', icon: Lock },
          ].map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => { setTab(t.id as any); setMsg(null) }}
                style={{
                  padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 13, fontWeight: 500, border: 'none', background: 'transparent',
                  cursor: 'pointer', borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
                  color: tab === t.id ? 'var(--primary)' : 'var(--gray-600)'
                }}>
                <Icon size={15} />{t.label}
              </button>
            )
          })}
        </div>

        <div style={{ padding: 28 }}>
          {tab === 'info' && (
            <div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="form-input" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="form-input" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1-555-0100" />
              </div>
            </div>
          )}

          {tab === 'password' && (
            <div>
              {[
                { key: 'currentPassword', label: 'Current Password', show: showPw.current, toggle: () => setShowPw(p => ({ ...p, current: !p.current })) },
                { key: 'newPassword', label: 'New Password', show: showPw.new, toggle: () => setShowPw(p => ({ ...p, new: !p.new })) },
                { key: 'confirmPassword', label: 'Confirm New Password', show: showPw.confirm, toggle: () => setShowPw(p => ({ ...p, confirm: !p.confirm })) },
              ].map(({ key, label, show, toggle }) => (
                <div className="form-group" key={key}>
                  <label className="form-label">{label}</label>
                  <div style={{ position: 'relative' }}>
                    <input type={show ? 'text' : 'password'} className="form-input"
                      value={(pwForm as any)[key]}
                      onChange={e => setPw(key, e.target.value)}
                      placeholder="••••••••"
                      style={{ paddingRight: 40 }} />
                    <button type="button" onClick={toggle}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}>
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Password must be at least 6 characters.</div>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--gray-200)', background: 'var(--gray-50)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={tab === 'info' ? handleSaveProfile : handleChangePassword} disabled={saving}>
            <Save size={15} />
            {saving ? 'Saving...' : tab === 'info' ? 'Save Profile' : 'Change Password'}
          </button>
        </div>
      </div>
    </div>
  )
}
