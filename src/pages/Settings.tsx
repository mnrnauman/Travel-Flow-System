import { useState, useEffect } from 'react'
import { Save, Mail, Globe, FileText, Building2, Send, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../lib/api'
import { Spinner } from '../components/ui'

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Europe/Moscow', 'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Bangkok',
  'Asia/Singapore', 'Asia/Tokyo', 'Asia/Seoul', 'Australia/Sydney', 'Pacific/Auckland'
]

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'PKR', 'INR', 'JPY', 'CAD', 'AUD', 'SGD', 'MYR', 'THB', 'KWD', 'BHD', 'OMR', 'QAR']

export default function Settings() {
  const [tab, setTab] = useState<'agency' | 'invoice' | 'email' | 'locale'>('agency')
  const [settings, setSettings] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testResult, setTestResult] = useState<{ success?: boolean; error?: string } | null>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data)).catch(() => {})
  }, [])

  const set = (k: string, v: any) => setSettings((s: any) => ({ ...s, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    setMsg(null)
    try {
      const r = await api.put('/settings', settings)
      setSettings(r.data)
      setMsg({ type: 'success', text: 'Settings saved successfully!' })
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    setTestResult(null)
    try {
      const r = await api.post('/settings/test-email', { to: testEmail })
      setTestResult(r.data)
    } catch (err: any) {
      setTestResult({ success: false, error: err.response?.data?.error || 'Failed to send' })
    }
  }

  if (!settings) return <Spinner />

  const tabs = [
    { id: 'agency', label: 'Agency Profile', icon: Building2 },
    { id: 'invoice', label: 'Invoice & Quotation', icon: FileText },
    { id: 'email', label: 'Email / SMTP', icon: Mail },
    { id: 'locale', label: 'Localization', icon: Globe },
  ]

  return (
    <div>
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

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Tab header */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', background: 'var(--gray-50)' }}>
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button key={t.id}
                onClick={() => setTab(t.id as any)}
                style={{
                  padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 13, fontWeight: 500, border: 'none', background: 'transparent',
                  cursor: 'pointer', borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
                  color: tab === t.id ? 'var(--primary)' : 'var(--gray-600)',
                  transition: 'all 0.15s'
                }}>
                <Icon size={15} />{t.label}
              </button>
            )
          })}
        </div>

        <div style={{ padding: 28 }}>
          {/* Agency Profile Tab */}
          {tab === 'agency' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--gray-800)' }}>Agency Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Agency Name *</label>
                  <input className="form-input" value={settings.name || ''} onChange={e => set('name', e.target.value)} placeholder="GCIT Travel Agency" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input type="email" className="form-input" value={settings.email || ''} onChange={e => set('email', e.target.value)} placeholder="info@agency.com" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" value={settings.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+1-555-0100" />
                </div>
                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input className="form-input" value={settings.website || ''} onChange={e => set('website', e.target.value)} placeholder="https://www.agency.com" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input className="form-input" value={settings.address || ''} onChange={e => set('address', e.target.value)} placeholder="123 Travel Street" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-input" value={settings.city || ''} onChange={e => set('city', e.target.value)} placeholder="Dubai" />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input className="form-input" value={settings.country || ''} onChange={e => set('country', e.target.value)} placeholder="United Arab Emirates" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Logo URL</label>
                <input className="form-input" value={settings.logo || ''} onChange={e => set('logo', e.target.value)} placeholder="https://cdn.example.com/logo.png" />
                {settings.logo && (
                  <div style={{ marginTop: 8 }}>
                    <img src={settings.logo} alt="Logo preview" style={{ height: 48, borderRadius: 6, objectFit: 'contain', border: '1px solid var(--gray-200)', padding: 4 }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Invoice & Quotation Tab */}
          {tab === 'invoice' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--gray-800)' }}>Invoice & Quotation Settings</h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Invoice Number Prefix</label>
                  <input className="form-input" value={settings.invoicePrefix || 'INV'} onChange={e => set('invoicePrefix', e.target.value)} placeholder="INV" />
                  <small style={{ color: 'var(--gray-400)', fontSize: 11 }}>e.g. INV → INV-00001</small>
                </div>
                <div className="form-group">
                  <label className="form-label">Quotation Number Prefix</label>
                  <input className="form-input" value={settings.quotationPrefix || 'QUO'} onChange={e => set('quotationPrefix', e.target.value)} placeholder="QUO" />
                  <small style={{ color: 'var(--gray-400)', fontSize: 11 }}>e.g. QUO → QUO-00001</small>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Default Tax Rate (%)</label>
                  <input type="number" className="form-input" value={settings.taxRate ?? 0} min={0} max={100} step={0.5} onChange={e => set('taxRate', Number(e.target.value))} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Terms (days)</label>
                  <input type="number" className="form-input" value={settings.paymentTerms || '30'} onChange={e => set('paymentTerms', e.target.value)} placeholder="30" />
                  <small style={{ color: 'var(--gray-400)', fontSize: 11 }}>Net-30, Net-15, etc.</small>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Invoice Footer / Terms & Conditions</label>
                <textarea className="form-input" rows={4} value={settings.invoiceFooter || ''}
                  onChange={e => set('invoiceFooter', e.target.value)}
                  placeholder="Payment is due within 30 days. All prices are in USD. Thank you for your business!" />
              </div>
            </div>
          )}

          {/* Email / SMTP Tab */}
          {tab === 'email' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: 'var(--gray-800)' }}>Email / SMTP Settings</h3>
              <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 20 }}>
                Configure SMTP to send booking confirmations, invoices, and automation emails.
              </p>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">SMTP Host</label>
                  <input className="form-input" value={settings.smtpHost || ''} onChange={e => set('smtpHost', e.target.value)} placeholder="smtp.gmail.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">SMTP Port</label>
                  <input type="number" className="form-input" value={settings.smtpPort || 587} onChange={e => set('smtpPort', Number(e.target.value))} placeholder="587" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">SMTP Username</label>
                  <input className="form-input" value={settings.smtpUser || ''} onChange={e => set('smtpUser', e.target.value)} placeholder="your@gmail.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">SMTP Password</label>
                  <input type="password" className="form-input" value={settings.smtpPass || ''} onChange={e => set('smtpPass', e.target.value)} placeholder="••••••••" />
                  <small style={{ color: 'var(--gray-400)', fontSize: 11 }}>Leave blank to keep existing password</small>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">From Email</label>
                  <input type="email" className="form-input" value={settings.smtpFrom || ''} onChange={e => set('smtpFrom', e.target.value)} placeholder="noreply@agency.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">From Name</label>
                  <input className="form-input" value={settings.smtpFromName || ''} onChange={e => set('smtpFromName', e.target.value)} placeholder="GCIT Travel Agency" />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <input type="checkbox" id="smtpSecure" checked={settings.smtpSecure ?? true} onChange={e => set('smtpSecure', e.target.checked)} />
                <label htmlFor="smtpSecure" style={{ fontSize: 13, cursor: 'pointer' }}>Use SSL/TLS (recommended for port 465)</label>
              </div>

              <div style={{ background: 'var(--gray-50)', borderRadius: 10, padding: 16, border: '1px solid var(--gray-200)' }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Test Email Configuration</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" style={{ flex: 1 }} type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="Send test to..." />
                  <button className="btn btn-primary" onClick={handleTestEmail} style={{ whiteSpace: 'nowrap' }}>
                    <Send size={14} /> Send Test
                  </button>
                </div>
                {testResult && (
                  <div style={{ marginTop: 10, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
                    color: testResult.success ? '#16a34a' : '#dc2626' }}>
                    {testResult.success ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    {testResult.success ? 'Test email sent successfully!' : `Failed: ${testResult.error}`}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Localization Tab */}
          {tab === 'locale' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--gray-800)' }}>Localization</h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Default Currency</label>
                  <select className="form-input" value={settings.currency || 'USD'} onChange={e => set('currency', e.target.value)}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Timezone</label>
                  <select className="form-input" value={settings.timezone || 'UTC'} onChange={e => set('timezone', e.target.value)}>
                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ background: '#eff6ff', borderRadius: 8, padding: 14, fontSize: 13, color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                The default currency is used when creating new leads, quotations, bookings, and invoices. Individual records can still use different currencies.
              </div>
            </div>
          )}
        </div>

        {/* Save footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--gray-200)', background: 'var(--gray-50)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={15} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
