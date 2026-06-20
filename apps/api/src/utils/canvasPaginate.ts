import { AxiosInstance } from 'axios'

/**
 * Recorre todas las páginas de un endpoint de Canvas siguiendo el header `Link`
 * (rel="next"). Canvas pagina por defecto, así que pedir solo per_page no basta:
 * sin esto se pierden cursos/tareas más allá de la primera página.
 */
export const fetchAllPages = async <T = any>(
  client: AxiosInstance,
  url: string
): Promise<T[]> => {
  const results: T[] = []
  let nextUrl: string | null = url

  while (nextUrl) {
    const response = await client.get<T[]>(nextUrl)
    if (Array.isArray(response.data)) {
      results.push(...response.data)
    }

    const linkHeader: string | undefined = response.headers?.link
    nextUrl = parseNextLink(linkHeader)
  }

  return results
}

const parseNextLink = (linkHeader?: string): string | null => {
  if (!linkHeader) return null
  // formato: <https://.../courses?page=2>; rel="next", <...>; rel="last"
  const parts = linkHeader.split(',')
  for (const part of parts) {
    const match = part.match(/<([^>]+)>\s*;\s*rel="next"/)
    if (match) return match[1]
  }
  return null
}
