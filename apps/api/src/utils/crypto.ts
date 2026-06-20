import crypto from 'crypto'

/**
 * Cifrado simétrico (AES-256-GCM) para secretos guardados en reposo,
 * como el access token de Canvas.
 *
 * Requiere la variable de entorno ENCRYPTION_KEY: una cadena de 32 bytes
 * en hex (64 caracteres). Puedes generarla con:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
const ALGO = 'aes-256-gcm'

const getKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length !== 64) {
    throw new Error('ENCRYPTION_KEY debe ser una cadena hex de 64 caracteres (32 bytes)')
  }
  return Buffer.from(key, 'hex')
}

export const encrypt = (plain: string): string => {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  // formato: iv:tag:ciphertext (todo en hex)
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

export const decrypt = (payload: string): string => {
  const [ivHex, tagHex, dataHex] = payload.split(':')
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error('Formato de dato cifrado inválido')
  }
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()])
  return decrypted.toString('utf8')
}
