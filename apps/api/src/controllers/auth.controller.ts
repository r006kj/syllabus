import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'
import { createAuthClient } from '../lib/supabaseAuth'
import { requireFields, isEmail, AppError } from '../utils/validate'

export const register = async (req: Request, res: Response) => {
  requireFields(req.body, ['email', 'password', 'name'])
  const { email, password, name, username } = req.body
  if (!isEmail(email)) throw new AppError('Email inválido')
  if (typeof password !== 'string' || password.length < 6) {
    throw new AppError('La contraseña debe tener al menos 6 caracteres')
  }

  // Use admin client (service key) to create user with email already confirmed.
  // This bypasses email confirmation and Supabase email rate limits entirely.
  const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, username: username ?? null },
  })

  if (adminError) {
    const msg = adminError.message.toLowerCase()
    if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('already exists')) {
      return res.status(400).json({ error: 'Este correo ya está registrado.' })
    }
    return res.status(400).json({ error: adminError.message })
  }

  const userId = adminData.user.id

  // Create the profile row so the rest of the app can find it immediately
  await supabase.from('profiles').upsert({
    id:    userId,
    name,
    email,
  })

  // Sign in with the anon client to get a proper session for the frontend
  const authClient = createAuthClient()
  const { data: loginData, error: loginError } = await authClient.auth.signInWithPassword({ email, password })

  if (loginError) {
    // User was created but login failed for some reason — return without session
    return res.status(201).json({ user: adminData.user, session: null })
  }

  return res.status(201).json({ user: loginData.user, session: loginData.session })
}

export const login = async (req: Request, res: Response) => {
  requireFields(req.body, ['email', 'password'])
  const { email, password } = req.body
  const authClient = createAuthClient()

  const { data, error } = await authClient.auth.signInWithPassword({ email, password })

  if (error) return res.status(400).json({ error: error.message })
  return res.json({ user: data.user, session: data.session })
}

export const logout = async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1]
  const authClient = createAuthClient()

  const { error } = await authClient.auth.signOut(token as any)
  if (error) return res.status(400).json({ error: error.message })
  return res.json({ message: 'Logged out' })
}

export const me = async (req: Request, res: Response) => {
  return res.json({ user: req.user })
}