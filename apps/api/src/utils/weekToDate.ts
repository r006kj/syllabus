/**
 * Convierte un número de semana del ciclo (semana 1, 2, ...) en una fecha real,
 * tomando como referencia la fecha de inicio del ciclo (term.start_at de Canvas).
 *
 * La evaluación se coloca al final de esa semana (viernes ~23:00) como
 * aproximación razonable de fecha de entrega. Devuelve ISO 8601 o null si no
 * hay fecha de inicio o el número de semana no es válido.
 */
export const weekNumberToDate = (
  termStart: string | undefined | null,
  week: number | undefined | null
): string | null => {
  if (!termStart || !week || week < 1) return null

  const start = new Date(termStart)
  if (isNaN(start.getTime())) return null

  const date = new Date(start)
  // Lunes de la semana N (semana 1 = la del inicio del ciclo).
  date.setDate(date.getDate() + (week - 1) * 7)
  // Avanzamos hasta el viernes de esa semana.
  const day = date.getDay() // 0=domingo ... 5=viernes
  const daysToFriday = (5 - day + 7) % 7
  date.setDate(date.getDate() + daysToFriday)
  date.setHours(23, 0, 0, 0)

  return date.toISOString()
}
