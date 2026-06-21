import { Request, Response } from 'express'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SUPPORT_EMAIL_USER,   // tu gmail remitente
    pass: process.env.SUPPORT_EMAIL_PASS,   // app password de gmail
  }
})

export const sendReport = async (req: Request, res: Response) => {
  const user  = (req as any).user
  const { message } = req.body
  const files = (req as any).files as Express.Multer.File[] | undefined

  if (!message) return res.status(400).json({ error: 'El mensaje es requerido' })

  const attachments = (files ?? []).map(f => ({
    filename: f.originalname,
    content:  f.buffer,
    contentType: f.mimetype,
  }))

  try {
    await transporter.sendMail({
      from:    `"Syllabus App" <${process.env.SUPPORT_EMAIL_USER}>`,
      to:      'rafaella.cano45@gmail.com',
      subject: `[Bug Report] ${user?.email ?? 'usuario desconocido'}`,
      text:    `Usuario: ${user?.email}\n\n${message}`,
      html:    `<p><strong>Usuario:</strong> ${user?.email}</p><hr><p>${message.replace(/\n/g,'<br>')}</p>`,
      attachments,
    })
    return res.json({ message: 'Reporte enviado' })
  } catch (e: any) {
    console.error('Error enviando reporte:', e.message)
    return res.status(500).json({ error: 'No se pudo enviar el reporte' })
  }
}