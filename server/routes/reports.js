import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/dashboard', async (req, res) => {
  try {
    const agencyId = req.agencyId
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    const [
      totalLeads, newLeadsThisMonth, convertedLeads,
      totalCustomers,
      totalBookings, bookingsThisMonth,
      invoiceStats,
      monthlyRevenue,
      leadsByStatus,
      leadsBySource,
      bookingsByStatus,
      topAgents
    ] = await Promise.all([
      prisma.lead.count({ where: { agencyId } }),
      prisma.lead.count({ where: { agencyId, createdAt: { gte: startOfMonth } } }),
      prisma.lead.count({ where: { agencyId, status: 'BOOKED' } }),
      prisma.customer.count({ where: { agencyId } }),
      prisma.booking.count({ where: { agencyId } }),
      prisma.booking.count({ where: { agencyId, createdAt: { gte: startOfMonth } } }),
      prisma.invoice.aggregate({
        where: { agencyId },
        _sum: { total: true, amountPaid: true, amountDue: true }
      }),
      prisma.invoice.groupBy({
        by: ['createdAt'],
        where: { agencyId, createdAt: { gte: startOfYear } },
        _sum: { total: true }
      }),
      prisma.lead.groupBy({ by: ['status'], where: { agencyId }, _count: true }),
      prisma.lead.groupBy({ by: ['source'], where: { agencyId }, _count: true }),
      prisma.booking.groupBy({ by: ['status'], where: { agencyId }, _count: true }),
      prisma.user.findMany({
        where: { agencyId, role: 'AGENT' },
        select: {
          id: true, firstName: true, lastName: true,
          _count: { select: { assignedBookings: true, assignedLeads: true } }
        }
      })
    ])

    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0

    res.json({
      leads: {
        total: totalLeads,
        thisMonth: newLeadsThisMonth,
        converted: convertedLeads,
        conversionRate,
        byStatus: leadsByStatus.reduce((acc, l) => ({ ...acc, [l.status]: l._count }), {}),
        bySource: leadsBySource.reduce((acc, l) => ({ ...acc, [l.source]: l._count }), {})
      },
      customers: { total: totalCustomers },
      bookings: {
        total: totalBookings,
        thisMonth: bookingsThisMonth,
        byStatus: bookingsByStatus.reduce((acc, b) => ({ ...acc, [b.status]: b._count }), {})
      },
      revenue: {
        total: invoiceStats._sum.total || 0,
        collected: invoiceStats._sum.amountPaid || 0,
        outstanding: invoiceStats._sum.amountDue || 0
      },
      agents: topAgents.map(a => ({
        id: a.id,
        name: `${a.firstName} ${a.lastName}`,
        bookings: a._count.assignedBookings,
        leads: a._count.assignedLeads
      }))
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/sales', async (req, res) => {
  try {
    const { from, to } = req.query
    const where = { agencyId: req.agencyId }
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const [bookings, invoices] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          customer: { select: { firstName: true, lastName: true } },
          agent: { select: { firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.invoice.aggregate({
        where,
        _sum: { total: true, amountPaid: true }
      })
    ])

    res.json({ bookings, revenue: invoices._sum })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
