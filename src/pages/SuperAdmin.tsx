import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  Building2, Users, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  LogOut, TrendingUp, BookOpen, X, Eye, EyeOff, ChevronDown, ChevronUp,
  Plane, RefreshCw, UserPlus, Shield
} from 'lucide-react'
import api from '../lib/api'

interface Agency {
  id: string
  name: string
  slug: string
  email: string
  phone?: string
  planTier: string
  primaryColor?: string
  isActive: boolean
  createdAt: string
  _count: { users: number; leads: number; customers: number; bookings: number }
}

interface AgencyUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

interface Stats {
  totalAgencies: number
  activeAgencies: number
  totalUsers: number
  totalBookings: number
}

const PLAN_OPTIONS = ['starter', 'professional', 'enterprise']
const ROLE_OPTIONS = ['ADMIN', 'MANAGER', 'AGENT']

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
    }}>
      <div style={{
        background: 'white', borderRadius: 16, width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #e2e8f0'
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{title}</h2>
          <button onClick={onClose} style={{
            background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  )
}

function FormInput({ label, value, onChange, type = 'text', placeholder = '', required = false }: any) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        style={{
          width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8,
          fontSize: 14, color: '#1e293b', outline: 'none', boxSizing: 'border-box'
        }} />
    </div>
  )
}

function SelectInput({ label, value, onChange, options }: any) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8,
          fontSize: 14, color: '#1e293b', outline: 'none', boxSizing: 'border-box', background: 'white'
        }}>
        {options.map((o: string) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1).toLowerCase()}</option>)}
      </select>
    </div>
  )
}

export default function SuperAdmin() {
  const { superAdmin, logout } = useAuth()
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editAgency, setEditAgency] = useState<Agency | null>(null)
  const [expandedAgency, setExpandedAgency] = useState<string | null>(null)
  const [agencyUsers, setAgencyUsers] = useState<Record<string, AgencyUser[]>>({})
  const [showAddUser, setShowAddUser] = useState<string | null>(null)

  const [createForm, setCreateForm] = useState({
    agencyName: '', slug: '', email: '', phone: '',
    adminFirstName: '', adminLastName: '', adminEmail: '', adminPassword: '',
    planTier: 'starter', primaryColor: '#2563eb'
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [showAdminPass, setShowAdminPass] = useState(false)

  const [userForm, setUserForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'AGENT' })
  const [userLoading, setUserLoading] = useState(false)
  const [userError, setUserError] = useState('')

  const authHeader = { headers: { Authorization: `Bearer ${localStorage.getItem('crm_token')}` } }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [agRes, stRes] = await Promise.all([
        api.get('/super-admin/agencies', authHeader),
        api.get('/super-admin/stats', authHeader)
      ])
      setAgencies(agRes.data)
      setStats(stRes.data)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const loadUsers = async (agencyId: string) => {
    try {
      const res = await api.get(`/super-admin/agencies/${agencyId}/users`, authHeader)
      setAgencyUsers(prev => ({ ...prev, [agencyId]: res.data }))
    } catch {}
  }

  const toggleExpand = async (id: string) => {
    if (expandedAgency === id) {
      setExpandedAgency(null)
    } else {
      setExpandedAgency(id)
      if (!agencyUsers[id]) await loadUsers(id)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreateLoading(true)
    try {
      await api.post('/super-admin/agencies', createForm, authHeader)
      setShowCreate(false)
      setCreateForm({ agencyName: '', slug: '', email: '', phone: '', adminFirstName: '', adminLastName: '', adminEmail: '', adminPassword: '', planTier: 'starter', primaryColor: '#2563eb' })
      load()
    } catch (err: any) {
      setCreateError(err.response?.data?.error || 'Failed to create agency')
    }
    setCreateLoading(false)
  }

  const handleToggleActive = async (agency: Agency) => {
    try {
      await api.put(`/super-admin/agencies/${agency.id}`, { isActive: !agency.isActive }, authHeader)
      load()
    } catch {}
  }

  const handleDelete = async (agency: Agency) => {
    if (!confirm(`Deactivate "${agency.name}"? They will lose access.`)) return
    try {
      await api.delete(`/super-admin/agencies/${agency.id}`, authHeader)
      load()
    } catch {}
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showAddUser) return
    setUserError('')
    setUserLoading(true)
    try {
      await api.post(`/super-admin/agencies/${showAddUser}/users`, userForm, authHeader)
      setShowAddUser(null)
      setUserForm({ firstName: '', lastName: '', email: '', password: '', role: 'AGENT' })
      await loadUsers(showAddUser)
    } catch (err: any) {
      setUserError(err.response?.data?.error || 'Failed to create user')
    }
    setUserLoading(false)
  }

  const handleDeleteUser = async (agencyId: string, userId: string, name: string) => {
    if (!confirm(`Remove user "${name}"?`)) return
    try {
      await api.delete(`/super-admin/agencies/${agencyId}/users/${userId}`, authHeader)
      await loadUsers(agencyId)
    } catch {}
  }

  const platformUrl = window.location.origin

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Top Bar */}
      <div style={{
        background: '#0f172a', borderBottom: '1px solid #1e293b',
        padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, background: '#1e293b', border: '1px solid #334155',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Plane size={18} color="#94a3b8" />
          </div>
          <div>
            <div style={{ color: 'white', fontSize: 15, fontWeight: 700 }}>Travel Agency CRM</div>
            <div style={{ color: '#475569', fontSize: 11 }}>Platform Administration</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, background: '#1e293b', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Shield size={15} color="#94a3b8" />
            </div>
            <div>
              <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{superAdmin?.name}</div>
              <div style={{ color: '#64748b', fontSize: 11 }}>{superAdmin?.email}</div>
            </div>
          </div>
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            background: '#1e293b', border: '1px solid #334155', borderRadius: 8,
            color: '#94a3b8', fontSize: 13, cursor: 'pointer'
          }}>
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ padding: '28px 28px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Total Agencies', value: stats.totalAgencies, icon: Building2, color: '#2563eb' },
              { label: 'Active Agencies', value: stats.activeAgencies, icon: ToggleRight, color: '#16a34a' },
              { label: 'Total Users', value: stats.totalUsers, icon: Users, color: '#7c3aed' },
              { label: 'Total Bookings', value: stats.totalBookings, icon: BookOpen, color: '#ea580c' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'white', borderRadius: 12, padding: '20px 22px',
                border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16
              }}>
                <div style={{
                  width: 44, height: 44, background: `${s.color}15`, borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <s.icon size={20} color={s.color} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Agencies Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Agencies</h1>
            <p style={{ fontSize: 13, color: '#64748b' }}>Manage all client agencies on the platform</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={load} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
              background: 'white', border: '1px solid #e2e8f0', borderRadius: 8,
              color: '#64748b', fontSize: 13, cursor: 'pointer'
            }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={() => setShowCreate(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px',
              background: '#2563eb', border: 'none', borderRadius: 8,
              color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}>
              <Plus size={15} /> Create Agency
            </button>
          </div>
        </div>

        {/* Agencies List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading agencies...</div>
        ) : agencies.length === 0 ? (
          <div style={{
            background: 'white', borderRadius: 12, border: '2px dashed #e2e8f0',
            padding: 60, textAlign: 'center'
          }}>
            <Building2 size={40} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>No agencies yet</div>
            <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 20 }}>Create your first client agency to get started</div>
            <button onClick={() => setShowCreate(true)} style={{
              padding: '10px 22px', background: '#2563eb', border: 'none', borderRadius: 8,
              color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer'
            }}>
              Create First Agency
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {agencies.map(ag => (
              <div key={ag.id} style={{
                background: 'white', borderRadius: 12, border: '1px solid #e2e8f0',
                overflow: 'hidden', opacity: ag.isActive ? 1 : 0.65
              }}>
                {/* Agency Row */}
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: ag.primaryColor ? `${ag.primaryColor}20` : '#eff6ff',
                    border: `2px solid ${ag.primaryColor || '#2563eb'}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Plane size={18} color={ag.primaryColor || '#2563eb'} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{ag.name}</span>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 20,
                        background: ag.isActive ? '#dcfce7' : '#fee2e2',
                        color: ag.isActive ? '#16a34a' : '#dc2626', fontWeight: 600
                      }}>
                        {ag.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 20,
                        background: '#f1f5f9', color: '#64748b', fontWeight: 600
                      }}>
                        {ag.planTier}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>
                        Login: <span style={{ color: '#2563eb', fontFamily: 'monospace', fontSize: 11 }}>
                          {platformUrl}/{ag.slug}
                        </span>
                      </span>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{ag.email}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                    {[
                      { label: 'Users', val: ag._count.users, color: '#7c3aed' },
                      { label: 'Leads', val: ag._count.leads, color: '#2563eb' },
                      { label: 'Customers', val: ag._count.customers, color: '#16a34a' },
                      { label: 'Bookings', val: ag._count.bookings, color: '#ea580c' },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => toggleExpand(ag.id)} title="Manage Users" style={{
                      padding: '7px 10px', background: '#f8fafc', border: '1px solid #e2e8f0',
                      borderRadius: 8, cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4
                    }}>
                      <Users size={14} />
                      {expandedAgency === ag.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    <button onClick={() => handleToggleActive(ag)} title={ag.isActive ? 'Deactivate' : 'Activate'} style={{
                      padding: '7px 10px', background: '#f8fafc', border: '1px solid #e2e8f0',
                      borderRadius: 8, cursor: 'pointer', color: ag.isActive ? '#16a34a' : '#dc2626'
                    }}>
                      {ag.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </button>
                    <button onClick={() => handleDelete(ag)} title="Deactivate Agency" style={{
                      padding: '7px 10px', background: '#fef2f2', border: '1px solid #fecaca',
                      borderRadius: 8, cursor: 'pointer', color: '#dc2626'
                    }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Expanded Users Panel */}
                {expandedAgency === ag.id && (
                  <div style={{ borderTop: '1px solid #f1f5f9', padding: '16px 20px', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                        Users ({agencyUsers[ag.id]?.length ?? '...'})
                      </span>
                      <button onClick={() => setShowAddUser(ag.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                        background: '#2563eb', border: 'none', borderRadius: 7,
                        color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                      }}>
                        <UserPlus size={12} /> Add User
                      </button>
                    </div>
                    {!agencyUsers[ag.id] ? (
                      <div style={{ color: '#94a3b8', fontSize: 13 }}>Loading users...</div>
                    ) : agencyUsers[ag.id].length === 0 ? (
                      <div style={{ color: '#94a3b8', fontSize: 13 }}>No users found.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {agencyUsers[ag.id].map(u => (
                          <div key={u.id} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            background: 'white', borderRadius: 8, padding: '10px 14px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <div style={{
                              width: 32, height: 32, background: '#eff6ff', borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12, fontWeight: 700, color: '#2563eb', flexShrink: 0
                            }}>
                              {u.firstName[0]}{u.lastName[0]}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                                {u.firstName} {u.lastName}
                              </div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>{u.email}</div>
                            </div>
                            <span style={{
                              fontSize: 11, padding: '2px 8px', borderRadius: 20,
                              background: '#f1f5f9', color: '#64748b', fontWeight: 600
                            }}>
                              {u.role}
                            </span>
                            <span style={{
                              fontSize: 11, padding: '2px 8px', borderRadius: 20,
                              background: u.isActive ? '#dcfce7' : '#fee2e2',
                              color: u.isActive ? '#16a34a' : '#dc2626', fontWeight: 600
                            }}>
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <button onClick={() => handleDeleteUser(ag.id, u.id, `${u.firstName} ${u.lastName}`)}
                              style={{
                                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6,
                                padding: '5px 8px', cursor: 'pointer', color: '#dc2626'
                              }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Agency Modal */}
      {showCreate && (
        <Modal title="Create New Agency" onClose={() => { setShowCreate(false); setCreateError('') }}>
          <form onSubmit={handleCreate}>
            <div style={{ marginBottom: 20, padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Agency Details</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <FormInput label="Agency Name" value={createForm.agencyName} required
                  onChange={(v: string) => {
                    const slug = v.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
                    setCreateForm(f => ({ ...f, agencyName: v, slug }))
                  }} placeholder="e.g. GoodLuck Travel" />
              </div>
              <FormInput label="URL Slug" value={createForm.slug} required
                onChange={(v: string) => setCreateForm(f => ({ ...f, slug: v }))} placeholder="goodluck-travel" />
              <FormInput label="Brand Color" value={createForm.primaryColor}
                onChange={(v: string) => setCreateForm(f => ({ ...f, primaryColor: v }))} placeholder="#2563eb" />
              <FormInput label="Agency Email" value={createForm.email} type="email"
                onChange={(v: string) => setCreateForm(f => ({ ...f, email: v }))} placeholder="info@agency.com" />
              <FormInput label="Phone" value={createForm.phone}
                onChange={(v: string) => setCreateForm(f => ({ ...f, phone: v }))} placeholder="+1 000 000 0000" />
            </div>
            <SelectInput label="Plan Tier" value={createForm.planTier} options={PLAN_OPTIONS}
              onChange={(v: string) => setCreateForm(f => ({ ...f, planTier: v }))} />

            {createForm.slug && (
              <div style={{
                background: '#eff6ff', borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                fontSize: 12, color: '#2563eb'
              }}>
                Login URL: <strong>{platformUrl}/{createForm.slug}</strong>
              </div>
            )}

            <div style={{ height: 1, background: '#e2e8f0', margin: '20px 0' }} />
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 16 }}>Admin User Account</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <FormInput label="First Name" value={createForm.adminFirstName}
                onChange={(v: string) => setCreateForm(f => ({ ...f, adminFirstName: v }))} placeholder="John" />
              <FormInput label="Last Name" value={createForm.adminLastName}
                onChange={(v: string) => setCreateForm(f => ({ ...f, adminLastName: v }))} placeholder="Smith" />
              <div style={{ gridColumn: '1/-1' }}>
                <FormInput label="Admin Email" value={createForm.adminEmail} type="email" required
                  onChange={(v: string) => setCreateForm(f => ({ ...f, adminEmail: v }))} placeholder="admin@agency.com" />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    Admin Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input type={showAdminPass ? 'text' : 'password'} value={createForm.adminPassword} required
                      onChange={e => setCreateForm(f => ({ ...f, adminPassword: e.target.value }))}
                      placeholder="Minimum 6 characters"
                      style={{
                        width: '100%', padding: '9px 40px 9px 12px', border: '1px solid #d1d5db',
                        borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box'
                      }} />
                    <button type="button" onClick={() => setShowAdminPass(!showAdminPass)} style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8'
                    }}>
                      {showAdminPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {createError && (
              <div style={{
                background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8,
                padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626'
              }}>{createError}</div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowCreate(false)} style={{
                padding: '9px 18px', background: '#f1f5f9', border: '1px solid #e2e8f0',
                borderRadius: 8, color: '#64748b', fontSize: 14, cursor: 'pointer'
              }}>Cancel</button>
              <button type="submit" disabled={createLoading} style={{
                padding: '9px 22px', background: '#2563eb', border: 'none', borderRadius: 8,
                color: 'white', fontSize: 14, fontWeight: 600, cursor: createLoading ? 'not-allowed' : 'pointer',
                opacity: createLoading ? 0.7 : 1
              }}>
                {createLoading ? 'Creating...' : 'Create Agency'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <Modal title="Add User to Agency" onClose={() => { setShowAddUser(null); setUserError('') }}>
          <form onSubmit={handleAddUser}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <FormInput label="First Name" value={userForm.firstName}
                onChange={(v: string) => setUserForm(f => ({ ...f, firstName: v }))} placeholder="John" />
              <FormInput label="Last Name" value={userForm.lastName}
                onChange={(v: string) => setUserForm(f => ({ ...f, lastName: v }))} placeholder="Smith" />
              <div style={{ gridColumn: '1/-1' }}>
                <FormInput label="Email" value={userForm.email} type="email" required
                  onChange={(v: string) => setUserForm(f => ({ ...f, email: v }))} placeholder="user@agency.com" />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <FormInput label="Password" value={userForm.password} type="password" required
                  onChange={(v: string) => setUserForm(f => ({ ...f, password: v }))} placeholder="Minimum 6 characters" />
              </div>
            </div>
            <SelectInput label="Role" value={userForm.role} options={ROLE_OPTIONS}
              onChange={(v: string) => setUserForm(f => ({ ...f, role: v }))} />

            {userError && (
              <div style={{
                background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8,
                padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626'
              }}>{userError}</div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowAddUser(null)} style={{
                padding: '9px 18px', background: '#f1f5f9', border: '1px solid #e2e8f0',
                borderRadius: 8, color: '#64748b', fontSize: 14, cursor: 'pointer'
              }}>Cancel</button>
              <button type="submit" disabled={userLoading} style={{
                padding: '9px 22px', background: '#2563eb', border: 'none', borderRadius: 8,
                color: 'white', fontSize: 14, fontWeight: 600, cursor: userLoading ? 'not-allowed' : 'pointer',
                opacity: userLoading ? 0.7 : 1
              }}>
                {userLoading ? 'Adding...' : 'Add User'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
