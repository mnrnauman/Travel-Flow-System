import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

// List all commissions for the agency
router.get('/', async (req, res) => {
  try {
    const { status, agentId, page = 1, limit = 50 } = req.query
    const where = { booking: { agencyId: req.agencyId } }
    if (status) where.status = status
    if (agentId) where.userId = agentId

    const [items, total] = await Promise.all([
      prisma.commission.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          booking: { select: { id: true, bookingNumber: true, title: true, totalAmount: true, currency: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.commission.count({ where })
    ])

    // Summary stats
    const stats = await prisma.commission.aggregate({
      where: { booking: { agencyId: req.agencyId } },
      _sum: { amount: true }
    })
    const pending = await prisma.commission.aggregate({
      where: { booking: { agencyId: req.agencyId }, status: 'pending' },
      _sum: { amount: true }
    })
    const paid = await prisma.commission.aggregate({
      where: { booking: { agencyId: req.agencyId }, status: 'paid' },
      _sum: { amount: true }
    })

    res.json({
      commissions: items, total,
      stats: {
        total: stats._sum.amount || 0,
        pending: pending._sum.amount || 0,
        paid: paid._sum.amount || 0
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create commission entry
router.post('/', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { bookingId, userId, amount, rate } = req.body
    if (!bookingId || !userId || !amount) {
      return res.status(400).json({ error: 'Booking, agent, and amount required' })
    }
    const booking = await prisma.booking.findFirst({ where: { id: bookingId, agencyId: req.agencyId } })
    if (!booking) return res.status(404).json({ error: 'Booking not found' })

    const commission = await prisma.commission.create({
      data: {
        bookingId,
        userId,
        amount: Number(amount),
        rate: Number(rate) || 0,
        status: 'pending'
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        booking: { select: { id: true, bookingNumber: true, title: true } }
      }
    })
    res.status(201).json(commission)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Mark commission as paid
router.put('/:id', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { status } = req.body
    const commission = await prisma.commission.update({
      where: { id: req.params.id },
      data: {
        status,
        ...(status === 'paid' && { paidAt: new Date() })
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        booking: { select: { id: true, bookingNumber: true, title: true } }
      }
    })
    res.json(commission)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete commission
router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    await prisma.commission.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Agent's own commissions
router.get('/my', async (req, res) => {
  try {
    const items = await prisma.commission.findMany({
      where: { userId: req.user.id },
      include: {
        booking: { select: { id: true, bookingNumber: true, title: true, totalAmount: true, currency: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    const stats = await prisma.commission.aggregate({
      where: { userId: req.user.id },
      _sum: { amount: true }
    })
    const pending = await prisma.commission.aggregate({
      where: { userId: req.user.id, status: 'pending' },
      _sum: { amount: true }
    })
    res.json({ commissions: items, stats: { total: stats._sum.amount || 0, pending: pending._sum.amount || 0 } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
