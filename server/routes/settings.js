import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { sendEmail } from '../lib/email.js'

const router = Router()
router.use(authenticate)

// GET agency settings
router.get('/', async (req, res) => {
  try {
    const agency = await prisma.agency.findUnique({ where: { id: req.agencyId } })
    if (!agency) return res.status(404).json({ error: 'Agency not found' })
    const { stripeCustomerId, stripeSubscriptionId, smtpPass, ...safe } = agency
    res.json({ ...safe, smtpConfigured: !!agency.smtpHost })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT agency settings (admin/manager only)
router.put('/', requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const {
      name, email, phone, address, city, country, website, logo,
      currency, timezone, taxRate, invoicePrefix, quotationPrefix,
      paymentTerms, invoiceFooter,
      smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, smtpFromName, smtpSecure
    } = req.body

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (country !== undefined) updateData.country = country
    if (website !== undefined) updateData.website = website
    if (logo !== undefined) updateData.logo = logo
    if (currency !== undefined) updateData.currency = currency
    if (timezone !== undefined) updateData.timezone = timezone
    if (taxRate !== undefined) updateData.taxRate = Number(taxRate) || 0
    if (invoicePrefix !== undefined) updateData.invoicePrefix = invoicePrefix
    if (quotationPrefix !== undefined) updateData.quotationPrefix = quotationPrefix
    if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms
    if (invoiceFooter !== undefined) updateData.invoiceFooter = invoiceFooter
    if (smtpHost !== undefined) updateData.smtpHost = smtpHost
    if (smtpPort !== undefined) updateData.smtpPort = smtpPort ? Number(smtpPort) : null
    if (smtpUser !== undefined) updateData.smtpUser = smtpUser
    if (smtpPass !== undefined && smtpPass !== '') updateData.smtpPass = smtpPass
    if (smtpFrom !== undefined) updateData.smtpFrom = smtpFrom
    if (smtpFromName !== undefined) updateData.smtpFromName = smtpFromName
    if (smtpSecure !== undefined) updateData.smtpSecure = Boolean(smtpSecure)

    const agency = await prisma.agency.update({
      where: { id: req.agencyId },
      data: updateData
    })

    const { stripeCustomerId, stripeSubscriptionId, smtpPass: sp, ...safe } = agency
    res.json({ ...safe, smtpConfigured: !!agency.smtpHost })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Test SMTP
router.post('/test-email', requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { to } = req.body
    const result = await sendEmail(req.agencyId, {
      to: to || req.user.email,
      subject: 'GCIT Travel Agency CRM — SMTP Test',
      html: '<h2>SMTP test successful!</h2><p>Your email settings are configured correctly.</p>',
      text: 'SMTP test successful! Your email settings are configured correctly.'
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
