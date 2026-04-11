import { useState, useEffect } from 'react'
import { CalendarDays, Plane, DollarSign, Phone, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import api from '../lib/api'
import { Spinner } from '../components/ui'

interface CalEvent {
  id: string
  date: string
  type: 'departure' | 'return' | 'invoice_due' | 'followup'
  title: string
  sub: string
  color: string
  link: string
  linkId: string
}

const TYPE_ICON: Record<string, any> = {
  departure: Plane,
  return: Plane,
  invoice_due: DollarSign,
  followup: Phone,
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function Calendar({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [today] = useState(new Date())
  const [current, setCurrent] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/bookings?limit=100'),
      api.get('/invoices?limit=100'),
      api.get('/leads?limit=100'),
    ]).then(([bk, inv, leads]) => {
      const evts: CalEvent[] = []

      for (const b of (bk.data.bookings || bk.data)) {
        if (b.departureDate) evts.push({
          id: `dep-${b.id}`, date: b.departureDate.slice(0,10),
          type: 'departure', title: `Departure: ${b.title || b.bookingNumber}`,
          sub: b.bookingNumber, color: '#2563eb', link: 'bookings', linkId: b.id
        })
        if (b.returnDate) evts.push({
          id: `ret-${b.id}`, date: b.returnDate.slice(0,10),
          type: 'return', title: `Return: ${b.title || b.bookingNumber}`,
          sub: b.bookingNumber, color: '#7c3aed', link: 'bookings', linkId: b.id
        })
      }

      for (const inv of (bk.data.invoices || [])) {
        if (inv.dueDate && inv.status !== 'PAID' && inv.status !== 'CANCELLED') evts.push({
          id: `inv-${inv.id}`, date: inv.dueDate.slice(0,10),
          type: 'invoice_due', title: `Invoice Due: ${inv.invoiceNumber}`,
          sub: `${inv.currency} ${inv.amountDue?.toLocaleString()}`,
          color: '#d97706', link: 'invoices', linkId: inv.id
        })
      }

      for (const i of (inv.data || [])) {
        if (i.dueDate && i.status !== 'PAID' && i.status !== 'CANCELLED') evts.push({
          id: `inv2-${i.id}`, date: i.dueDate.slice(0,10),
          type: 'invoice_due', title: `Invoice Due: ${i.invoiceNumber}`,
          sub: `${i.currency} ${i.amountDue?.toLocaleString()}`,
          color: '#d97706', link: 'invoices', linkId: i.id
        })
      }

      for (const l of (leads.data.leads || leads.data)) {
        if (l.followUpDate && l.status !== 'BOOKED' && l.status !== 'LOST') evts.push({
          id: `fup-${l.id}`, date: l.followUpDate.slice(0,10),
          type: 'followup', title: `Follow-up: ${l.firstName} ${l.lastName}`,
          sub: l.destination || l.email || '',
          color: '#059669', link: 'leads', linkId: l.id
        })
      }

      const unique = Array.from(new Map(evts.map(e => [e.id, e])).values())
      setEvents(unique)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const year = current.getFullYear()
  const month = current.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const eventsOnDay = (d: number) => {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    return events.filter(e => e.date === dateStr)
  }

  const selectedEvents = selectedDay ? eventsOnDay(selectedDay) : []
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  if (loading) return <Spinner />

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
      {/* Calendar Grid */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>{MONTHS[month]} {year}</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-icon" onClick={() => setCurrent(new Date(year, month-1))}>
              <ChevronLeft size={18} />
            </button>
            <button className="btn" onClick={() => setCurrent(new Date())} style={{ padding: '4px 12px', fontSize: 12, border: '1px solid var(--gray-200)', borderRadius: 6 }}>
              Today
            </button>
            <button className="btn-icon" onClick={() => setCurrent(new Date(year, month+1))}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div style={{ padding: '0 0 16px' }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--gray-100)' }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', padding: '8px 0', fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} style={{ minHeight: 80, borderRight: '1px solid var(--gray-100)', borderBottom: '1px solid var(--gray-100)' }} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1
              const dayEvts = eventsOnDay(d)
              const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
              const isToday = dateStr === todayStr
              const isSelected = selectedDay === d
              return (
                <div key={d}
                  onClick={() => setSelectedDay(d === selectedDay ? null : d)}
                  style={{
                    minHeight: 80, padding: '6px 8px',
                    borderRight: '1px solid var(--gray-100)', borderBottom: '1px solid var(--gray-100)',
                    cursor: dayEvts.length > 0 || true ? 'pointer' : 'default',
                    background: isSelected ? '#eff6ff' : 'transparent',
                    transition: 'background 0.1s'
                  }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: isToday ? 'var(--primary)' : 'transparent',
                    color: isToday ? 'white' : 'var(--gray-700)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: isToday ? 700 : 400, marginBottom: 4
                  }}>{d}</div>
                  {dayEvts.slice(0, 3).map(e => (
                    <div key={e.id} style={{
                      fontSize: 10, padding: '2px 5px', borderRadius: 3, marginBottom: 2,
                      background: e.color + '20', color: e.color,
                      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontWeight: 500
                    }}>
                      {e.title}
                    </div>
                  ))}
                  {dayEvts.length > 3 && (
                    <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>+{dayEvts.length - 3} more</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Sidebar: event list */}
      <div>
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-header"><span className="card-title">
            <CalendarDays size={15} />
            {selectedDay ? `${MONTHS[month]} ${selectedDay}` : 'Upcoming Events'}
          </span></div>
          <div className="card-body" style={{ padding: '0 0 8px' }}>
            {(selectedDay ? selectedEvents : events.filter(e => e.date >= todayStr).sort((a,b) => a.date.localeCompare(b.date)).slice(0, 12)).length === 0 ? (
              <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
                No events {selectedDay ? 'on this day' : 'upcoming'}
              </div>
            ) : (selectedDay ? selectedEvents : events.filter(e => e.date >= todayStr).sort((a,b) => a.date.localeCompare(b.date)).slice(0, 12)).map(evt => {
              const Icon = TYPE_ICON[evt.type] || AlertCircle
              return (
                <div key={evt.id}
                  onClick={() => onNavigate?.(evt.link)}
                  style={{
                    padding: '10px 16px', borderBottom: '1px solid var(--gray-100)',
                    cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start'
                  }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 6, background: evt.color + '20',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Icon size={14} color={evt.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {evt.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{evt.sub}</div>
                    {!selectedDay && <div style={{ fontSize: 10, color: evt.color, marginTop: 2 }}>{evt.date}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: 'var(--gray-600)' }}>Legend</div>
          {[
            { color: '#2563eb', label: 'Departure' },
            { color: '#7c3aed', label: 'Return' },
            { color: '#d97706', label: 'Invoice Due' },
            { color: '#059669', label: 'Follow-up' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
              <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
