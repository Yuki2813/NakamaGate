import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

// Bloquea las rutas privadas. Mientras AuthContext está hidratando el
// usuario (loading=true) pintamos un spinner en vez de un redirect: si
// redirigiésemos durante la carga, un refresh con sesión válida nos echaría
// a /login antes de que /auth/me confirme la sesión.
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}
