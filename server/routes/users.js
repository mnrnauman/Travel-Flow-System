import { Router } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { agencyId: req.agencyId },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        phone: true, role: true, isActive: true, commissionRate: true,
        createdAt: true,
        _count: { select: { assignedLeads: true, assignedBookings: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id/performance', async (req, res) => {
  try {
    const [bookings, commissions, leads] = await Promise.all([
      prisma.booking.count({ where: { agentId: req.params.id, agencyId: req.agencyId } }),
      prisma.commission.aggregate({
        where: { userId: req.params.id },
        _sum: { amount: true }
      }),
      prisma.lead.count({ where: { assignedToId: req.params.id, agencyId: req.agencyId } })
    ])
    const converted = await prisma.lead.count({
      where: { assignedToId: req.params.id, agencyId: req.agencyId, status: 'BOOKED' }
    })
    res.json({
      bookings,
      totalCommission: commissions._sum.amount || 0,
      leadsAssigned: leads,
      leadsConverted: converted,
      conversionRate: leads > 0 ? Math.round((converted / leads) * 100) : 0
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role, commissionRate } = req.body
    const hashed = await bcrypt.hash(password || 'changeme123', 12)
    const user = await prisma.user.create({
      data: {
        agencyId: req.agencyId,
        email, password: hashed,
        firstName, lastName, phone,
        role: role || 'AGENT',
        commissionRate: Number(commissionRate) || 0
      },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        phone: true, role: true, isActive: true, commissionRate: true
      }
    })
    res.status(201).json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { firstName, lastName, phone, role, isActive, commissionRate } = req.body
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { firstName, lastName, phone, role, isActive, commissionRate: Number(commissionRate) },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        phone: true, role: true, isActive: true, commissionRate: true
      }
    })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
