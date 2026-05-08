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

router.get('/today', async (req, res) => {
  try {
    const agencyId = req.agencyId
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
    const in90Days = new Date(todayStart.getTime() + 90 * 24 * 60 * 60 * 1000)

    const [departures, followUps, overdueInvoices, recentBookings, expiringPassports] = await Promise.all([
      prisma.booking.findMany({
        where: { agencyId, departureDate: { gte: todayStart, lt: todayEnd }, status: { not: 'CANCELLED' } },
        include: { customer: { select: { firstName: true, lastName: true, phone: true } } },
        orderBy: { departureDate: 'asc' }
      }),
      prisma.lead.findMany({
        where: { agencyId, followUpDate: { gte: todayStart, lt: todayEnd }, status: { notIn: ['BOOKED', 'LOST'] } },
        include: { assignedTo: { select: { firstName: true, lastName: true } } },
        orderBy: { followUpDate: 'asc' }
      }),
      prisma.invoice.findMany({
        where: { agencyId, status: { in: ['OVERDUE', 'SENT', 'PARTIAL'] }, dueDate: { lt: todayEnd } },
        include: { customer: { select: { firstName: true, lastName: true } } },
        orderBy: { dueDate: 'asc' },
        take: 10
      }),
      prisma.booking.findMany({
        where: { agencyId },
        include: { customer: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.customer.findMany({
        where: {
          agencyId,
          passportExpiry: { gte: todayStart, lte: in90Days }
        },
        select: {
          id: true, firstName: true, lastName: true, phone: true,
          passportExpiry: true, passportNumber: true
        },
        orderBy: { passportExpiry: 'asc' },
        take: 20
      })
    ])

    res.json({ departures, followUps, overdueInvoices, recentBookings, expiringPassports })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/monthly', async (req, res) => {
  try {
    const agencyId = req.agencyId
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1)

    const [invoices, bookings, leads] = await Promise.all([
      prisma.invoice.findMany({
        where: { agencyId, createdAt: { gte: start } },
        select: { createdAt: true, total: true, amountPaid: true }
      }),
      prisma.booking.findMany({
        where: { agencyId, createdAt: { gte: start } },
        select: { createdAt: true }
      }),
      prisma.lead.findMany({
        where: { agencyId, createdAt: { gte: start } },
        select: { createdAt: true }
      })
    ])

    const months = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

      const mInvoices = invoices.filter(inv => {
        const d2 = new Date(inv.createdAt)
        return `${d2.getFullYear()}-${d2.getMonth()}` === key
      })

      months.push({
        month: label,
        revenue: mInvoices.reduce((s, inv) => s + (inv.total || 0), 0),
        collected: mInvoices.reduce((s, inv) => s + (inv.amountPaid || 0), 0),
        bookings: bookings.filter(b => {
          const d2 = new Date(b.createdAt)
          return `${d2.getFullYear()}-${d2.getMonth()}` === key
        }).length,
        leads: leads.filter(l => {
          const d2 = new Date(l.createdAt)
          return `${d2.getFullYear()}-${d2.getMonth()}` === key
        }).length
      })
    }

    res.json({ months })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/export/bookings', async (req, res) => {
  try {
    const { from, to, status } = req.query
    const where = { agencyId: req.agencyId }
    if (status) where.status = status
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
        agent: { select: { firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    const rows = [
      ['Booking #', 'Title', 'Customer', 'Email', 'Phone', 'Agent', 'Destination', 'Departure', 'Return', 'Travelers', 'Amount', 'Currency', 'Paid', 'Payment Status', 'Booking Status', 'Created'],
      ...bookings.map(b => [
        b.bookingNumber, b.title,
        `${b.customer?.firstName || ''} ${b.customer?.lastName || ''}`.trim(),
        b.customer?.email || '',
        b.customer?.phone || '',
        b.agent ? `${b.agent.firstName} ${b.agent.lastName}` : '',
        b.destination || '',
        b.departureDate ? new Date(b.departureDate).toLocaleDateString() : '',
        b.returnDate ? new Date(b.returnDate).toLocaleDateString() : '',
        b.numTravelers,
        b.totalAmount,
        b.currency,
        b.paidAmount,
        b.paymentStatus,
        b.status,
        new Date(b.createdAt).toLocaleDateString()
      ])
    ]

    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="bookings.csv"')
    res.send(csv)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/export/leads', async (req, res) => {
  try {
    const { from, to, status } = req.query
    const where = { agencyId: req.agencyId }
    if (status) where.status = status
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const leads = await prisma.lead.findMany({
      where,
      include: { assignedTo: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' }
    })

    const rows = [
      ['First Name', 'Last Name', 'Email', 'Phone', 'Source', 'Status', 'Destination', 'Travel Dates', 'Travelers', 'Budget', 'Currency', 'Assigned To', 'Follow-up Date', 'Notes', 'Created'],
      ...leads.map(l => [
        l.firstName, l.lastName, l.email || '', l.phone || '',
        l.source, l.status, l.destination || '', l.travelDates || '',
        l.numTravelers || '', l.budget || '', l.currency,
        l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}` : '',
        l.followUpDate ? new Date(l.followUpDate).toLocaleDateString() : '',
        (l.notes || '').replace(/\n/g, ' '),
        new Date(l.createdAt).toLocaleDateString()
      ])
    ]

    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"')
    res.send(csv)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
