import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'

type AuthState = 'loading' | 'authed' | 'guest'

/**
 * Protege las rutas privadas. Comprueba la sesión real de Supabase (no solo
 * localStorage), de modo que valga tanto para el login con email como con
 * Google, y no rebote a /login por un token desincronizado.
 */
export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>('loading')

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setState(data.session ? 'authed' : 'guest')
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setState(session ? 'authed' : 'guest')
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  if (state === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  if (state === 'guest') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
