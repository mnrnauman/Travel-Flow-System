import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '../lib/api'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
  agencyId: string
}

interface Agency {
  id: string
  name: string
  slug: string
  currency: string
  logo?: string
  primaryColor?: string
}

interface SuperAdmin {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  agency: Agency | null
  superAdmin: SuperAdmin | null
  isSuperAdmin: boolean
  token: string | null
  login: (email: string, password: string, slug?: string) => Promise<void>
  loginSuperAdmin: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (u: User) => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [agency, setAgency] = useState<Agency | null>(null)
  const [superAdmin, setSuperAdmin] = useState<SuperAdmin | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('crm_token')
    const savedUser = localStorage.getItem('crm_user')
    const savedAgency = localStorage.getItem('crm_agency')
    const savedSuperAdmin = localStorage.getItem('crm_super_admin')

    if (savedToken) {
      setToken(savedToken)
      if (savedSuperAdmin) {
        setSuperAdmin(JSON.parse(savedSuperAdmin))
      } else if (savedUser) {
        setUserState(JSON.parse(savedUser))
        if (savedAgency) setAgency(JSON.parse(savedAgency))
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string, slug?: string) => {
    const res = await api.post('/auth/login', { email, password, slug })
    const { token, user, agency } = res.data
    localStorage.setItem('crm_token', token)
    localStorage.setItem('crm_user', JSON.stringify(user))
    localStorage.setItem('crm_agency', JSON.stringify(agency))
    localStorage.removeItem('crm_super_admin')
    setToken(token)
    setUserState(user)
    setAgency(agency)
    setSuperAdmin(null)
  }

  const loginSuperAdmin = async (email: string, password: string) => {
    const res = await api.post('/auth/super-admin/login', { email, password })
    const { token, superAdmin } = res.data
    localStorage.setItem('crm_token', token)
    localStorage.setItem('crm_super_admin', JSON.stringify(superAdmin))
    localStorage.removeItem('crm_user')
    localStorage.removeItem('crm_agency')
    setToken(token)
    setSuperAdmin(superAdmin)
    setUserState(null)
    setAgency(null)
  }

  const logout = () => {
    localStorage.removeItem('crm_token')
    localStorage.removeItem('crm_user')
    localStorage.removeItem('crm_agency')
    localStorage.removeItem('crm_super_admin')
    setToken(null)
    setUserState(null)
    setAgency(null)
    setSuperAdmin(null)
  }

  const setUser = (u: User) => {
    setUserState(u)
    localStorage.setItem('crm_user', JSON.stringify(u))
  }

  return (
    <AuthContext.Provider value={{
      user, agency, superAdmin, isSuperAdmin: !!superAdmin,
      token, login, loginSuperAdmin, logout, setUser, loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
