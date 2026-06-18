import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export const AuthCallback = () => {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        localStorage.setItem('access_token', data.session.access_token)
        localStorage.setItem('user', JSON.stringify(data.session.user))
        navigate('/dashboard')
      } else {
        navigate('/login')
      }
    })
  }, [navigate])

  return <div className="min-h-screen flex items-center justify-center">Iniciando sesión...</div>
}