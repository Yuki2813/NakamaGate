import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiClient } from '@/api/client'

interface User {
  id: number
  email: string
  username?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Verificar si hay una sesión activa
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Aquí puedes hacer una petición para obtener los datos del usuario
      // De momento asumimos que el token es válido
      setUser({ id: 0, email: '' }) // Esto puede ser mejorado
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password })
      localStorage.setItem('token', response.data.access_token)
      setUser(response.data.user || { id: 0, email })
    } catch (error) {
      localStorage.removeItem('token')
      throw error
    }
  }

  const register = async (email: string, username: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/register', { email, username, password })
      localStorage.setItem('token', response.data.access_token)
      setUser(response.data.user || { id: 0, email, username })
    } catch (error) {
      localStorage.removeItem('token')
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
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
