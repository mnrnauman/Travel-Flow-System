import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Plane, Eye, EyeOff, Shield } from 'lucide-react'
import api from '../lib/api'

interface AgencyBranding {
  id: string
  name: string
  slug: string
  logo?: string
  primaryColor?: string
}

interface LoginProps {
  slug?: string
}

export default function Login({ slug }: LoginProps) {
  const { login, loginSuperAdmin } = useAuth()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [branding, setBranding] = useState<AgencyBranding | null>(null)
  const [brandingLoading, setBrandingLoading] = useState(false)
  const [brandingError, setBrandingError] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })

  const isSuperAdminMode = !slug
  const primaryColor = branding?.primaryColor || '#2563eb'

  useEffect(() => {
    if (slug) {
      setBrandingLoading(true)
      setBrandingError('')
      api.get(`/auth/agency/${slug}`)
        .then(res => { setBranding(res.data); setBrandingLoading(false) })
        .catch(err => {
          setBrandingError(err.response?.data?.error || 'Agency not found')
          setBrandingLoading(false)
        })
    }
  }, [slug])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isSuperAdminMode) {
        await loginSuperAdmin(form.email, form.password)
      } else {
        await login(form.email, form.password, slug)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  if (slug && brandingLoading) {
    return (
      <div style={{
        minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 32, height: 32, border: '3px solid rgba(255,255,255,0.2)',
            borderTopColor: 'white', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px'
          }} />
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Loading...</div>
        </div>
      </div>
    )
  }

  if (slug && brandingError) {
    return (
      <div style={{
        minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>404</div>
          <div style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Agency Not Found</div>
          <div style={{ color: '#94a3b8', fontSize: 14 }}>The agency "{slug}" does not exist or has been deactivated.</div>
        </div>
      </div>
    )
  }

  const bgGradient = isSuperAdminMode
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
    : `linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)`

  return (
    <div style={{
      minHeight: '100vh', background: bgGradient,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo / Branding */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {branding?.logo ? (
            <img src={branding.logo} alt={branding.name}
              style={{ height: 56, width: 'auto', maxWidth: 200, margin: '0 auto 12px', display: 'block', borderRadius: 12 }} />
          ) : (
            <div style={{
              width: 56, height: 56,
              background: isSuperAdminMode ? '#1e293b' : primaryColor,
              border: isSuperAdminMode ? '2px solid #334155' : 'none',
              borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px',
              boxShadow: `0 0 30px ${primaryColor}66`
            }}>
              {isSuperAdminMode
                ? <Shield size={26} color="#94a3b8" />
                : <Plane size={26} color="white" />}
            </div>
          )}
          <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            {isSuperAdminMode ? 'Platform Admin' : (branding?.name || 'Travel Agency CRM')}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 13 }}>
            {isSuperAdminMode ? 'Super Administrator Access' : 'Sign in to your workspace'}
          </p>
        </div>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
          {isSuperAdminMode && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8,
              padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#92400e'
            }}>
              <Shield size={14} />
              Platform administrator login. Agencies use their own URL.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" required value={form.email}
                onChange={e => set('email', e.target.value)} placeholder="admin@agency.com"
                autoComplete="email" />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} className="form-input" required
                  value={form.password} onChange={e => set('password', e.target.value)}
                  placeholder="••••••••" style={{ paddingRight: 40 }}
                  autoComplete="current-password" />
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

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '11px 0', borderRadius: 8, border: 'none',
              background: isSuperAdminMode ? '#1e293b' : primaryColor,
              color: 'white', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, transition: 'all 0.15s', justifyContent: 'center'
            }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {!isSuperAdminMode && (
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
              Demo: admin@demo.com / demo123
            </p>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#475569' }}>
          Powered by Travel Agency CRM System
        </p>
      </div>
    </div>
  )
}
