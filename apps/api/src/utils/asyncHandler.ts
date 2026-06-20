import { Request, Response, NextFunction } from 'express'

type AsyncController = (req: Request, res: Response, next: NextFunction) => Promise<unknown>

/**
 * Envuelve un controlador async para que cualquier error (incluidas promesas
 * rechazadas por fallos de red de Canvas/OpenAI/Google) se reenvíe al
 * middleware global de errores en vez de tumbar el proceso.
 */
export const asyncHandler = (fn: AsyncController) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
