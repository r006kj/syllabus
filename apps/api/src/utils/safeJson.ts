/**
 * Parsea la respuesta de un modelo de IA de forma segura.
 * Limpia las vallas ```json ... ``` y, si el modelo añade texto alrededor,
 * intenta extraer el primer bloque JSON ([] o {}). Si nada es válido,
 * devuelve `fallback` en vez de lanzar y romper el endpoint.
 */
export const parseAiJson = <T>(raw: string | null | undefined, fallback: T): T => {
  if (!raw) return fallback

  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()

  try {
    return JSON.parse(cleaned) as T
  } catch {
    // El modelo a veces envuelve el JSON en texto. Intentamos rescatar el bloque.
    const match = cleaned.match(/[[{][\s\S]*[\]}]/)
    if (match) {
      try {
        return JSON.parse(match[0]) as T
      } catch {
        return fallback
      }
    }
    return fallback
  }
}
