import { supabase } from '../lib/supabase'
import { decrypt } from '../utils/crypto'

/**
 * Devuelve las credenciales de Canvas del usuario, descifrando el token.
 * Devuelve null si el usuario no ha conectado Canvas.
 */
export const getCanvasCredentials = async (
  userId: string
): Promise<{ domain: string; token: string } | null> => {
  const { data } = await supabase
    .from('profiles')
    .select('canvas_token, canvas_domain')
    .eq('id', userId)
    .maybeSingle()

  if (!data?.canvas_token || !data?.canvas_domain) return null

  let token: string
  try {
    token = decrypt(data.canvas_token)
  } catch {
    // Token stored as plaintext (connected before encryption was introduced)
    token = data.canvas_token
  }

  return { domain: data.canvas_domain, token }
}
