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

  // /auth/me en vez del JWT: el payload puede estar desfasado y es legible por cualquiera.
  const fetchUser = async () => {
    const res = await apiClient.get('/auth/me')

    let picture = null;
    if (res.data.picture) {
      picture = res.data.picture;
    }

    let isAdult = false;
    if (res.data.is_adult) {
      isAdult = res.data.is_adult;
    }

    setUser({
      id: res.data.id,
      email: res.data.email,
      alias: res.data.alias,
      picture: picture,
      rol: res.data.rol,
      is_adult: isAdult,
    })
  }

  // Hidratamos desde el token persistido; si /auth/me falla lo borramos para evitar bucles de 401.
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

  // Login Google en dos fases: si el email existe devuelve token; si es nuevo muestra onboarding.
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

  // Logout solo client-side: el JWT sigue válido en backend hasta su expiración.
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
