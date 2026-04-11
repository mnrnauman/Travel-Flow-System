import { Router } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma.js'
import { authenticateSuperAdmin } from '../middleware/auth.js'

const router = Router()
router.use(authenticateSuperAdmin)

// List all agencies with user counts
router.get('/agencies', async (req, res) => {
  try {
    const agencies = await prisma.agency.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { users: true, leads: true, customers: true, bookings: true } }
      }
    })
    res.json(agencies)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get single agency
router.get('/agencies/:id', async (req, res) => {
  try {
    const agency = await prisma.agency.findUnique({
      where: { id: req.params.id },
      include: {
        users: { select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true, createdAt: true } },
        _count: { select: { leads: true, customers: true, bookings: true, invoices: true } }
      }
    })
    if (!agency) return res.status(404).json({ error: 'Agency not found' })
    res.json(agency)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create agency + first admin user
router.post('/agencies', async (req, res) => {
  try {
    const { agencyName, slug: rawSlug, email, phone, adminFirstName, adminLastName, adminEmail, adminPassword, planTier, primaryColor } = req.body
    if (!agencyName || !adminEmail || !adminPassword) {
      return res.status(400).json({ error: 'Agency name, admin email and password are required' })
    }

    const slug = (rawSlug || agencyName)
      .toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

    const existing = await prisma.agency.findUnique({ where: { slug } })
    if (existing) return res.status(400).json({ error: `Slug "${slug}" already taken` })

    const hashed = await bcrypt.hash(adminPassword, 12)

    const agency = await prisma.agency.create({
      data: {
        name: agencyName,
        slug,
        email: email || adminEmail,
        phone: phone || null,
        planTier: planTier || 'starter',
        primaryColor: primaryColor || null,
        users: {
          create: {
            email: adminEmail,
            password: hashed,
            firstName: adminFirstName || 'Admin',
            lastName: adminLastName || 'User',
            role: 'ADMIN',
          }
        }
      },
      include: { users: true }
    })

    const { password: _p, ...safeUser } = agency.users[0]
    res.json({ ...agency, users: [safeUser] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Update agency
router.put('/agencies/:id', async (req, res) => {
  try {
    const { name, email, phone, address, city, country, website, planTier, isActive, primaryColor } = req.body
    const agency = await prisma.agency.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(country !== undefined && { country }),
        ...(website !== undefined && { website }),
        ...(planTier !== undefined && { planTier }),
        ...(isActive !== undefined && { isActive }),
        ...(primaryColor !== undefined && { primaryColor }),
      }
    })
    res.json(agency)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete / deactivate agency
router.delete('/agencies/:id', async (req, res) => {
  try {
    await prisma.agency.update({ where: { id: req.params.id }, data: { isActive: false } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// List users of an agency
router.get('/agencies/:id/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { agencyId: req.params.id },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true, createdAt: true }
    })
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create user for an agency
router.post('/agencies/:id/users', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        agencyId: req.params.id,
        firstName: firstName || 'User',
        lastName: lastName || '',
        email,
        password: hashed,
        role: role || 'AGENT',
      }
    })
    const { password: _p, ...safeUser } = user
    res.json(safeUser)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Update user
router.put('/agencies/:agencyId/users/:userId', async (req, res) => {
  try {
    const { firstName, lastName, email, role, isActive, password } = req.body
    const data = {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(email !== undefined && { email }),
      ...(role !== undefined && { role }),
      ...(isActive !== undefined && { isActive }),
    }
    if (password) data.password = await bcrypt.hash(password, 12)
    const user = await prisma.user.update({ where: { id: req.params.userId }, data })
    const { password: _p, ...safeUser } = user
    res.json(safeUser)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete user
router.delete('/agencies/:agencyId/users/:userId', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.userId } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Platform stats
router.get('/stats', async (req, res) => {
  try {
    const [totalAgencies, activeAgencies, totalUsers, totalBookings] = await Promise.all([
      prisma.agency.count(),
      prisma.agency.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.booking.count(),
    ])
    res.json({ totalAgencies, activeAgencies, totalUsers, totalBookings })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
