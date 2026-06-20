import crypto from 'crypto'

/**
 * Genera y valida el parámetro `state` del flujo OAuth de Google.
 *
 * En vez de exponer el user.id (predecible) lo firmamos con HMAC e incluimos
 * un timestamp, de modo que el callback pueda verificar que el state lo
 * emitimos nosotros y que no ha expirado. Mitiga CSRF sin necesitar tabla.
 *
 * Requiere OAUTH_STATE_SECRET en el entorno.
 */
const MAX_AGE_MS = 10 * 60 * 1000 // 10 minutos

const getSecret = (): string => {
  const secret = process.env.OAUTH_STATE_SECRET
  if (!secret) throw new Error('Falta OAUTH_STATE_SECRET en el entorno')
  return secret
}

const sign = (data: string): string =>
  crypto.createHmac('sha256', getSecret()).update(data).digest('hex')

export const createState = (userId: string): string => {
  const payload = `${userId}.${Date.now()}`
  const signature = sign(payload)
  return Buffer.from(`${payload}.${signature}`).toString('base64url')
}

export const verifyState = (state: string): string | null => {
  try {
    const decoded = Buffer.from(state, 'base64url').toString('utf8')
    const [userId, ts, signature] = decoded.split('.')
    if (!userId || !ts || !signature) return null

    const expected = sign(`${userId}.${ts}`)
    // comparación en tiempo constante
    if (
      signature.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      return null
    }

    if (Date.now() - Number(ts) > MAX_AGE_MS) return null

    return userId
  } catch {
    return null
  }
}
