import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persistir la sesión y refrescar el token automáticamente evita que el
    // token caduque y provoque 401 → redirección a /login (el "bucle").
    persistSession: true,
    autoRefreshToken: true,
    // Necesario para que el login con Google complete la sesión al volver a
    // /auth/callback (procesa el token que viene en la URL).
    detectSessionInUrl: true
  }
})
