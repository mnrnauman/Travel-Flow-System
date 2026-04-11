import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'

export function useApi<T>(url: string, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(url)
      setData(res.data)
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [url, ...deps])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}

export function useSubmit() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setSubmitting(true)
    setError(null)
    try {
      const result = await fn()
      return result
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'An error occurred'
      setError(msg)
      return null
    } finally {
      setSubmitting(false)
    }
  }

  return { submit, submitting, error, setError }
}
