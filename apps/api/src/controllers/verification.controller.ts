import { Request, Response } from 'express'
import nodemailer from 'nodemailer'

interface CodeEntry { code: string; expires: number }
const store = new Map<string, CodeEntry>()

const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.SUPPORT_EMAIL_USER, pass: process.env.SUPPORT_EMAIL_PASS },
})

const rand6 = () => String(Math.floor(100000 + Math.random() * 900000))

export const sendCode = async (req: Request, res: Response) => {
  const user = (req as any).user
  const code = rand6()

  store.set(user.id, { code, expires: Date.now() + 10 * 60 * 1000 })
  setTimeout(() => store.delete(user.id), 10 * 60 * 1000)

  try {
    await mailer.sendMail({
      from: `"Syllabus" <${process.env.SUPPORT_EMAIL_USER}>`,
      to: user.email,
      subject: 'Tu código de verificación',
      html: `
        <!DOCTYPE html>
        <html><body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px">
          <tr><td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08)">
              <tr><td style="background:linear-gradient(135deg,#C75E6E,#A8475A);padding:32px;text-align:center">
                <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px">Syllabus</span>
              </td></tr>
              <tr><td style="padding:40px 40px 32px">
                <h2 style="margin:0 0 8px;color:#111;font-size:20px;font-weight:700">Código de verificación</h2>
                <p style="margin:0 0 32px;color:#666;font-size:14px;line-height:1.6">
                  Usa este código para confirmar tu acción. Expira en <strong>10 minutos</strong>.
                </p>
                <div style="background:#fdf4f5;border:2px dashed #C75E6E;border-radius:12px;padding:24px;text-align:center;margin-bottom:32px">
                  <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#C75E6E;font-variant-numeric:tabular-nums">
                    ${code}
                  </span>
                </div>
                <p style="margin:0;color:#999;font-size:12px;text-align:center">
                  Si no solicitaste este código, ignora este correo. Tu cuenta sigue segura.
                </p>
              </td></tr>
              <tr><td style="background:#fafafa;padding:20px 40px;text-align:center;border-top:1px solid #eee">
                <span style="color:#bbb;font-size:11px">© Syllabus · Este es un correo automático</span>
              </td></tr>
            </table>
          </td></tr>
        </table>
        </body></html>
      `,
    })
    return res.json({ message: 'Código enviado' })
  } catch (e: any) {
    store.delete(user.id)
    console.error('Verification email error:', e.message)
    return res.status(500).json({ error: 'No se pudo enviar el correo' })
  }
}

export const verifyCode = async (req: Request, res: Response) => {
  const user = (req as any).user
  const { code } = req.body

  const entry = store.get(user.id)
  if (!entry || Date.now() > entry.expires) {
    store.delete(user.id)
    return res.status(400).json({ error: 'El código expiró. Solicita uno nuevo.' })
  }
  if (entry.code !== String(code).trim()) {
    return res.status(400).json({ error: 'Código incorrecto' })
  }

  store.delete(user.id)
  return res.json({ verified: true })
}
