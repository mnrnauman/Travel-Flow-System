import { useState } from 'react'
import { useApi, useSubmit } from '../hooks/useApi'
import { Spinner, ErrorBox, Modal } from '../components/ui'
import { Plus, Zap, Mail, MessageSquare, Bell } from 'lucide-react'
import api from '../lib/api'

const TRIGGERS = [
  'lead_created', 'lead_status_changed', 'quotation_sent',
  'booking_confirmed', 'invoice_sent', 'payment_overdue',
  'pre_trip_reminder', 'post_trip_followup'
]
const CHANNELS = ['email', 'whatsapp', 'sms', 'notification']

const triggerLabel: Record<string, string> = {
  lead_created: 'Lead Created',
  lead_status_changed: 'Lead Status Changed',
  quotation_sent: 'Quotation Sent',
  booking_confirmed: 'Booking Confirmed',
  invoice_sent: 'Invoice Sent',
  payment_overdue: 'Payment Overdue',
  pre_trip_reminder: 'Pre-Trip Reminder',
  post_trip_followup: 'Post-Trip Follow-up'
}

const SAMPLE_TEMPLATES = [
  {
    name: 'Welcome New Lead',
    trigger: 'lead_created',
    channel: 'email',
    subject: 'Thank you for your inquiry — {{agency_name}}',
    body: 'Dear {{first_name}},\n\nThank you for reaching out to {{agency_name}}. We have received your inquiry about {{destination}} and our team will get back to you within 24 hours.\n\nBest regards,\n{{agency_name}} Team',
    delayDays: 0
  },
  {
    name: 'Pre-Trip Reminder (3 days)',
    trigger: 'pre_trip_reminder',
    channel: 'email',
    subject: 'Your trip is in 3 days! — Important Info',
    body: 'Dear {{first_name}},\n\nYour upcoming trip to {{destination}} is just 3 days away! Please ensure:\n\n• Your passport is valid\n• You have your e-tickets ready\n• Hotel confirmations are printed\n\nHave a wonderful trip!\n{{agency_name}}',
    delayDays: -3
  },
  {
    name: 'Post-Trip Feedback',
    trigger: 'post_trip_followup',
    channel: 'email',
    subject: 'How was your trip? We\'d love to hear from you!',
    body: 'Dear {{first_name}},\n\nWe hope you had an amazing time on your trip to {{destination}}!\n\nWould you mind sharing your experience? Your feedback helps us improve our services.\n\nThank you for choosing {{agency_name}}.',
    delayDays: 2
  }
]

export default function Automation() {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '', trigger: 'lead_created', channel: 'email',
    subject: '', body: '', delayDays: '0'
  })
  const { submit, submitting, error: submitError } = useSubmit()
  const { data: templates, loading, error, refetch } = useApi<any[]>('/automations')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    const res = await submit(() =>
      api.post('/automations', { ...form, delayDays: Number(form.delayDays) })
    )
    if (res) { setShowModal(false); refetch() }
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    await api.put(`/automations/${id}`, { isActive: !isActive })
    refetch()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this automation?')) return
    await api.delete(`/automations/${id}`)
    refetch()
  }

  const loadSample = (sample: any) => {
    setForm({ ...sample, delayDays: String(sample.delayDays) })
    setShowModal(true)
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
          Automate your email and WhatsApp communications
        </div>
        <button className="btn btn-primary" onClick={() => {
          setForm({ name: '', trigger: 'lead_created', channel: 'email', subject: '', body: '', delayDays: '0' })
          setShowModal(true)
        }}><Plus size={15} /> New Automation</button>
      </div>

      {/* WhatsApp Integration Notice */}
      <div style={{
        background: '#dcfce7', border: '1px solid #86efac',
        borderRadius: 10, padding: '14px 18px', marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 12
      }}>
        <MessageSquare size={20} color="#16a34a" />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>WhatsApp Integration Ready</div>
          <div style={{ fontSize: 12, color: '#15803d' }}>
            WhatsApp automation is configured. Connect your WhatsApp Business API (360dialog, Twilio) in settings to activate.
          </div>
        </div>
      </div>

      {/* Sample Templates */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 10 }}>
          Quick Start Templates
        </div>
        <div className="grid-3" style={{ gap: 10 }}>
          {SAMPLE_TEMPLATES.map((t, i) => (
            <div key={i} style={{
              background: 'white', border: '1px dashed var(--gray-300)',
              borderRadius: 10, padding: 14, cursor: 'pointer'
            }} onClick={() => loadSample(t)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Mail size={14} color="var(--primary)" />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>
                Trigger: {triggerLabel[t.trigger]}
              </div>
              <div style={{ fontSize: 11, color: 'var(--primary)', marginTop: 4 }}>
                Click to add →
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Automations */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Active Automations</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Trigger</th>
                <th>Channel</th>
                <th>Delay</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!templates || templates.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state">
                    <Zap size={40} />
                    <p>No automations yet. Use templates above to get started.</p>
                  </div>
                </td></tr>
              ) : templates.map((t: any) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500 }}>{t.name}</td>
                  <td style={{ fontSize: 12 }}>{triggerLabel[t.trigger] || t.trigger}</td>
                  <td>
                    <span className="badge badge-blue" style={{ display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
                      {t.channel === 'email' ? <Mail size={10} /> : <MessageSquare size={10} />}
                      {t.channel}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {t.delayDays === 0 ? 'Immediately' :
                      t.delayDays > 0 ? `+${t.delayDays} days` : `${t.delayDays} days before`}
                  </td>
                  <td>
                    <button onClick={() => handleToggle(t.id, t.isActive)}
                      style={{
                        background: t.isActive ? 'var(--success)' : 'var(--gray-300)',
                        color: 'white', border: 'none', borderRadius: 99,
                        padding: '3px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer'
                      }}>
                      {t.isActive ? 'Active' : 'Paused'}
                    </button>
                  </td>
                  <td>
                    <button className="btn btn-sm" style={{ color: 'var(--danger)', border: '1px solid #fca5a5' }}
                      onClick={() => handleDelete(t.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title="New Automation" onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
                {submitting ? 'Saving...' : 'Create Automation'}
              </button>
            </>
          }>
          {submitError && <ErrorBox message={submitError} />}
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Trigger</label>
              <select className="form-select" value={form.trigger} onChange={e => set('trigger', e.target.value)}>
                {TRIGGERS.map(t => <option key={t} value={t}>{triggerLabel[t] || t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Channel</label>
              <select className="form-select" value={form.channel} onChange={e => set('channel', e.target.value)}>
                {CHANNELS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Delay (days)</label>
            <input type="number" className="form-input" value={form.delayDays}
              onChange={e => set('delayDays', e.target.value)}
              placeholder="0 = immediate, -3 = 3 days before, +2 = 2 days after" />
          </div>
          {form.channel === 'email' && (
            <div className="form-group">
              <label className="form-label">Email Subject</label>
              <input className="form-input" value={form.subject} onChange={e => set('subject', e.target.value)}
                placeholder="Use {{first_name}}, {{destination}}, {{agency_name}}" />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Message Body</label>
            <textarea className="form-input" rows={6} value={form.body} onChange={e => set('body', e.target.value)}
              placeholder="Available variables: {{first_name}}, {{last_name}}, {{destination}}, {{agency_name}}, {{booking_number}}" />
          </div>
        </Modal>
      )}
    </div>
  )
}
