import axios from 'axios'
import { supabase } from './supabase'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

api.interceptors.request.use(
  async (config) => {
    // Tomamos el token directamente de la sesión de Supabase: si está por
    // caducar, supabase lo refresca solo. Así evitamos usar un token obsoleto
    // de localStorage (causa de los 401 → redirección a login).
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token ?? localStorage.getItem('access_token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status

    if (status === 401) {
      await supabase.auth.signOut()
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)
