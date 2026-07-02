import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'
import { apiFetch } from '../lib/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('authToken'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => !!localStorage.getItem('authToken'))

  useEffect(() => {
    if (!token) return undefined

    let cancelled = false
    apiFetch('auth-me', { token })
      .then((data) => {
        if (!cancelled) setUser(data.user)
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem('authToken')
          setToken(null)
          setUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const login = useCallback(async (email, password) => {
    const data = await apiFetch('auth-login', { method: 'POST', body: { email, password } })
    localStorage.setItem('authToken', data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (name, email, password) => {
    const data = await apiFetch('auth-register', { method: 'POST', body: { name, email, password } })
    localStorage.setItem('authToken', data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('authToken')
    setToken(null)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    if (!token) return
    const data = await apiFetch('auth-me', { token })
    setUser(data.user)
  }, [token])

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
