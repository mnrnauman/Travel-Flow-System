import { Router } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma.js'
import { generateToken, authenticate } from '../middleware/auth.js'

const router = Router()

// Register agency + admin user
router.post('/register', async (req, res) => {
  try {
    const { agencyName, email, password, firstName, lastName, phone } = req.body
    if (!agencyName || !email || !password) {
      return res.status(400).json({ error: 'Agency name, email and password required' })
    }

    const slug = agencyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + Date.now()
    const existing = await prisma.user.findFirst({ where: { email, agency: { slug } } })
    if (existing) return res.status(400).json({ error: 'Email already registered' })

    const hashed = await bcrypt.hash(password, 12)

    const agency = await prisma.agency.create({
      data: {
        name: agencyName,
        slug,
        email,
        users: {
          create: {
            email,
            password: hashed,
            firstName: firstName || 'Admin',
            lastName: lastName || 'User',
            phone,
            role: 'ADMIN',
          }
        }
      },
      include: { users: true }
    })

    const user = agency.users[0]
    const token = generateToken(user.id)
    res.json({ token, user: sanitizeUser(user), agency: sanitizeAgency(agency) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const user = await prisma.user.findFirst({
      where: { email, isActive: true },
      include: { agency: true }
    })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = generateToken(user.id)
    res.json({ token, user: sanitizeUser(user), agency: sanitizeAgency(user.agency) })
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
  const { stripeCustomerId, stripeSubscriptionId, ...rest } = a
  return rest
}

export default router
