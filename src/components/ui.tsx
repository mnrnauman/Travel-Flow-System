import { ReactNode } from 'react'
import { Loader2, AlertCircle, Search } from 'lucide-react'

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <Loader2 size={size} className="spin" style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
    </div>
  )
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'var(--danger-light)', border: '1px solid #fca5a5',
      borderRadius: 8, padding: '12px 16px', marginBottom: 16
    }}>
      <AlertCircle size={16} color="var(--danger)" />
      <span style={{ fontSize: 13, color: '#dc2626' }}>{message}</span>
    </div>
  )
}

export function Empty({ icon, title, action }: { icon?: ReactNode; title?: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      {icon || <Search size={40} />}
      <p style={{ marginBottom: action ? 12 : 0 }}>{title || 'No items found'}</p>
      {action}
    </div>
  )
}

export function Modal({ title, onClose, children, footer }: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

export function StatusBadge({ status, map }: { status: string; map: Record<string, string> }) {
  const cls = map[status] || 'badge-gray'
  return <span className={`badge ${cls}`}>{status.replace(/_/g, ' ').toLowerCase()}</span>
}
