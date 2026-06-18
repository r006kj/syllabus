import { useState } from 'react'
import axios from 'axios'
import { supabase } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL

export const useAuth = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async (email: string, password: string) => {
  setLoading(true)
  setError(null)

  try {
    const { data } = await axios.post(`${API_URL}/auth/login`, { email, password })
    localStorage.setItem('access_token', data.session.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  } catch (err) {
    const message = axios.isAxiosError(err) ? err.response?.data?.error : 'Error al iniciar sesión'
    setError(message ?? 'Error al iniciar sesión')
    throw err
  } finally {
    setLoading(false)
  }
}
const loginWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  if (error) setError(error.message)
}
  const register = async (email: string, password: string, name: string) => {
  setLoading(true)
  setError(null)

  try {
    const { data } = await axios.post(`${API_URL}/auth/register`, { email, password, name })
    return data
  } catch (err) {
    const message = axios.isAxiosError(err) ? err.response?.data?.error : 'Error al registrarse'
    setError(message ?? 'Error al registrarse')
    throw err
  } finally {
    setLoading(false)
  }
}
  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  }

  return { login, register, logout, loginWithGoogle, loading, error }
}
