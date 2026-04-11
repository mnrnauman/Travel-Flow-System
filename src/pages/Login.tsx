import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Plane, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    agencyName: '', firstName: '', lastName: '',
    email: '', password: ''
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        await register(form)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, background: '#2563eb', borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', boxShadow: '0 0 30px rgba(37,99,235,0.4)'
          }}>
            <Plane size={26} color="white" />
          </div>
          <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>GCIT Travel Agency CRM</h1>
          <p style={{ color: '#94a3b8', fontSize: 13 }}>Travel Agency Management System</p>
        </div>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', marginBottom: 24, background: '#f1f5f9', borderRadius: 8, padding: 4 }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '8px 0', borderRadius: 6, fontSize: 13, fontWeight: 600,
                background: mode === m ? 'white' : 'transparent',
                color: mode === m ? '#1e293b' : '#64748b',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s', cursor: 'pointer', border: 'none'
              }}>
                {m === 'login' ? 'Sign In' : 'Register Agency'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <div className="form-group">
                  <label className="form-label">Agency Name</label>
                  <input className="form-input" required value={form.agencyName}
                    onChange={e => set('agencyName', e.target.value)} placeholder="Your Travel Agency" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input className="form-input" value={form.firstName}
                      onChange={e => set('firstName', e.target.value)} placeholder="John" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input className="form-input" value={form.lastName}
                      onChange={e => set('lastName', e.target.value)} placeholder="Smith" />
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" required value={form.email}
                onChange={e => set('email', e.target.value)} placeholder="admin@agency.com" />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} className="form-input" required
                  value={form.password} onChange={e => set('password', e.target.value)}
                  placeholder="••••••••" style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8'
                }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8,
                padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626'
              }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '10px 0', fontSize: 14 }}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Agency Account'}
            </button>
          </form>

          {mode === 'login' && (
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
              Demo: admin@demo.com / demo123
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
