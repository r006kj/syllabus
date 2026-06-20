import { Request, Response } from 'express'
import { createAuthClient } from '../lib/supabaseAuth'
import { requireFields, isEmail, AppError } from '../utils/validate'

export const register = async (req: Request, res: Response) => {
  requireFields(req.body, ['email', 'password', 'name'])
  const { email, password, name } = req.body
  if (!isEmail(email)) throw new AppError('Email inválido')
  if (typeof password !== 'string' || password.length < 6) {
    throw new AppError('La contraseña debe tener al menos 6 caracteres')
  }
  const authClient = createAuthClient()

  const { data, error } = await authClient.auth.signUp({
    email,
    password,
    options: { data: { name } }
  })

  if (error) return res.status(400).json({ error: error.message })
  return res.status(201).json({ user: data.user })
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