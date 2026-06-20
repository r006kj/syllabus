import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export const AuthCallback = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const goToDashboard = (session: { access_token: string; user: unknown }) => {
      localStorage.setItem('access_token', session.access_token)
      localStorage.setItem('user', JSON.stringify(session.user))
      navigate('/dashboard')
    }

    // Supabase procesa el token de la URL de forma asíncrona; escuchamos el
    // evento de sesión en vez de leerla una sola vez (evita rebotar a /login).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) goToDashboard(session)
    })

    // Por si la sesión ya estaba lista al montar.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) goToDashboard(data.session)
    })

    // Si tras unos segundos no hay sesión, asumimos que falló y volvemos al login.
    const timer = setTimeout(() => {
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) navigate('/login')
      })
    }, 4000)

    return () => {
      sub.subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [navigate])

  return <div className="min-h-screen flex items-center justify-center">Iniciando sesión...</div>
}
