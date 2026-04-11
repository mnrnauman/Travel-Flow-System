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
}

interface AuthContextType {
  user: User | null
  agency: Agency | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  setUser: (u: User) => void
  loading: boolean
}

interface RegisterData {
  agencyName: string
  email: string
  password: string
  firstName: string
  lastName: string
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [agency, setAgency] = useState<Agency | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('crm_token')
    const savedUser = localStorage.getItem('crm_user')
    const savedAgency = localStorage.getItem('crm_agency')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUserState(JSON.parse(savedUser))
      if (savedAgency) setAgency(JSON.parse(savedAgency))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, user, agency } = res.data
    localStorage.setItem('crm_token', token)
    localStorage.setItem('crm_user', JSON.stringify(user))
    localStorage.setItem('crm_agency', JSON.stringify(agency))
    setToken(token)
    setUserState(user)
    setAgency(agency)
  }

  const register = async (data: RegisterData) => {
    const res = await api.post('/auth/register', data)
    const { token, user, agency } = res.data
    localStorage.setItem('crm_token', token)
    localStorage.setItem('crm_user', JSON.stringify(user))
    localStorage.setItem('crm_agency', JSON.stringify(agency))
    setToken(token)
    setUserState(user)
    setAgency(agency)
  }

  const logout = () => {
    localStorage.removeItem('crm_token')
    localStorage.removeItem('crm_user')
    localStorage.removeItem('crm_agency')
    setToken(null)
    setUserState(null)
    setAgency(null)
  }

  const setUser = (u: User) => {
    setUserState(u)
    localStorage.setItem('crm_user', JSON.stringify(u))
  }

  return (
    <AuthContext.Provider value={{ user, agency, token, login, register, logout, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
