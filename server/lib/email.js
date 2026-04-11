import nodemailer from 'nodemailer'
import prisma from './prisma.js'

export async function getTransporter(agencyId) {
  const agency = await prisma.agency.findUnique({ where: { id: agencyId } })
  if (!agency?.smtpHost || !agency?.smtpUser || !agency?.smtpPass) return null

  return nodemailer.createTransport({
    host: agency.smtpHost,
    port: agency.smtpPort || 587,
    secure: agency.smtpSecure ?? true,
    auth: { user: agency.smtpUser, pass: agency.smtpPass }
  })
}

export async function sendEmail(agencyId, { to, subject, html, text }) {
  try {
    const agency = await prisma.agency.findUnique({ where: { id: agencyId } })
    const transporter = await getTransporter(agencyId)
    if (!transporter) return { success: false, error: 'SMTP not configured' }

    const from = agency.smtpFrom
      ? `"${agency.smtpFromName || agency.name}" <${agency.smtpFrom}>`
      : `"${agency.name}" <${agency.smtpUser}>`

    await transporter.sendMail({ from, to, subject, html, text })
    return { success: true }
  } catch (err) {
    console.error('Email error:', err.message)
    return { success: false, error: err.message }
  }
}

export function renderTemplate(body, vars = {}) {
  let result = body
  for (const [key, val] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, val || '')
  }
  return result
}
