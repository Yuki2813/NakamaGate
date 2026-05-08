import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiClient } from '@/api/client'

interface User {
  id: number
  email: string
  alias: string
  picture: string | null
  rol: string
  is_adult: boolean
}

interface GoogleCheckResult {
  status: 'existing' | 'new'
  email?: string
  suggested_alias?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: (credential: string) => Promise<GoogleCheckResult>
  completeGoogleSignup: (googleToken: string, alias: string, isAdult: boolean, acceptTerms: boolean) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    const res = await apiClient.get('/auth/me')
    setUser({
      id: res.data.id,
      email: res.data.email,
      alias: res.data.alias,
      picture: res.data.picture ?? null,
      rol: res.data.rol,
      is_adult: res.data.is_adult ?? false,
    })
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    fetchUser()
      .catch(() => {
        localStorage.removeItem('token')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password })
      localStorage.setItem('token', response.data.access_token)
      await fetchUser()
    } catch (error) {
      localStorage.removeItem('token')
      setUser(null)
      throw error
    }
  }

  const loginWithGoogle = async (credential: string): Promise<GoogleCheckResult> => {
    const response = await apiClient.post('/auth/google', { token: credential })
    if (response.data.status === 'existing') {
      try {
        localStorage.setItem('token', response.data.access_token)
        await fetchUser()
      } catch (error) {
        localStorage.removeItem('token')
        setUser(null)
        throw error
      }
      return { status: 'existing' }
    }
    return {
      status: 'new',
      email: response.data.email,
      suggested_alias: response.data.suggested_alias,
    }
  }

  const completeGoogleSignup = async (
    googleToken: string,
    alias: string,
    isAdult: boolean,
    acceptTerms: boolean,
  ) => {
    try {
      const response = await apiClient.post('/auth/google/complete', {
        google_token: googleToken,
        alias,
        is_adult: isAdult,
        accept_terms: acceptTerms,
      })
      localStorage.setItem('token', response.data.access_token)
      await fetchUser()
    } catch (error) {
      localStorage.removeItem('token')
      setUser(null)
      throw error
    }
  }

  const register = async (email: string, username: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/register', { email, username, password })
      localStorage.setItem('token', response.data.access_token)
      await fetchUser()
    } catch (error) {
      localStorage.removeItem('token')
      setUser(null)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        loginWithGoogle,
        completeGoogleSignup,
        register,
        logout,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
