import { Router } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma.js'
import { generateToken, generateSuperAdminToken, authenticate } from '../middleware/auth.js'

const router = Router()

// Public: get agency branding by slug (for branded login page)
router.get('/agency/:slug', async (req, res) => {
  try {
    const agency = await prisma.agency.findUnique({
      where: { slug: req.params.slug },
      select: { id: true, name: true, slug: true, logo: true, primaryColor: true, isActive: true }
    })
    if (!agency) return res.status(404).json({ error: 'Agency not found' })
    if (!agency.isActive) return res.status(403).json({ error: 'Agency account is inactive' })
    res.json(agency)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Login scoped to an agency slug
router.post('/login', async (req, res) => {
  try {
    const { email, password, slug } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    let whereClause = { email, isActive: true }
    if (slug) {
      whereClause = { ...whereClause, agency: { slug } }
    }

    const user = await prisma.user.findFirst({
      where: whereClause,
      include: { agency: true }
    })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    if (!user.agency.isActive) return res.status(403).json({ error: 'Agency account is inactive' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = generateToken(user.id)
    res.json({ token, user: sanitizeUser(user), agency: sanitizeAgency(user.agency) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Super admin login
router.post('/super-admin/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const sa = await prisma.superAdmin.findUnique({ where: { email } })
    if (!sa) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, sa.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = generateSuperAdminToken(sa.id)
    res.json({ token, superAdmin: { id: sa.id, email: sa.email, name: sa.name } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get current user
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: sanitizeUser(req.user), agency: sanitizeAgency(req.user.agency) })
})

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { firstName, lastName, phone, email } = req.body
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
      }
    })
    res.json({ user: sanitizeUser(updated) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Change password
router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return res.status(400).json({ error: 'Current password incorrect' })
    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

function sanitizeUser(u) {
  const { password, ...rest } = u
  return rest
}

function sanitizeAgency(a) {
  if (!a) return null
  const { stripeCustomerId, stripeSubscriptionId, smtpPass, ...rest } = a
  return rest
}

export default router
