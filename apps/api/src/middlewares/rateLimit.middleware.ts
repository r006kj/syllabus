import { Request, Response, NextFunction } from 'express'

/**
 * Rate limiter en memoria, sin dependencias externas. Suficiente para una sola
 * instancia. Si en el futuro se escala a varias instancias, conviene migrar a
 * un limitador respaldado por Redis (p. ej. ioredis + rate-limiter-flexible).
 */
type Bucket = { count: number; resetAt: number }

export const rateLimit = (options: { windowMs: number; max: number }) => {
  const hits = new Map<string, Bucket>()

  // Limpieza periódica para no acumular memoria.
  setInterval(() => {
    const now = Date.now()
    for (const [key, bucket] of hits) {
      if (now > bucket.resetAt) hits.delete(key)
    }
  }, options.windowMs).unref()

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? 'unknown'
    const now = Date.now()
    const bucket = hits.get(key)

    if (!bucket || now > bucket.resetAt) {
      hits.set(key, { count: 1, resetAt: now + options.windowMs })
      return next()
    }

    bucket.count++
    if (bucket.count > options.max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000)
      res.setHeader('Retry-After', retryAfter.toString())
      return res.status(429).json({ error: 'Demasiadas solicitudes, intenta más tarde' })
    }

    next()
  }
}
