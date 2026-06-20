import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/validate'

/**
 * Manejador global de errores. Captura cualquier error reenviado por
 * asyncHandler y responde con un JSON consistente en vez de tumbar el proceso.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : 'Error interno del servidor'
  console.error('[error]', message)

  if (res.headersSent) return

  // Errores esperados (validación, recurso no encontrado) llevan su propio status.
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message })
  }

  res.status(500).json({ error: 'Ocurrió un error procesando la solicitud' })
}

/** 404 para rutas no registradas. */
export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
}
