/**
 * Validación mínima de campos requeridos en el body, sin dependencias.
 * Lanza un AppError 400 si falta algún campo o no es string no vacío.
 */
export class AppError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

export const requireFields = (body: Record<string, unknown>, fields: string[]) => {
  const missing = fields.filter((f) => {
    const v = body?.[f]
    return v === undefined || v === null || (typeof v === 'string' && v.trim() === '')
  })
  if (missing.length > 0) {
    throw new AppError(`Faltan campos requeridos: ${missing.join(', ')}`)
  }
}

export const isEmail = (value: unknown): value is string =>
  typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
