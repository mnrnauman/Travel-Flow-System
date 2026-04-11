import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const agencyId = req.agencyId
    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const notifications = []

    const [overdueInvoices, dueSoonInvoices, followUpLeads, upcomingBookings, unpaidInvoices] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          agencyId,
          status: { notIn: ['PAID', 'CANCELLED'] },
          dueDate: { lt: now }
        },
        select: { id: true, invoiceNumber: true, amountDue: true, currency: true, dueDate: true, customer: { select: { firstName: true, lastName: true } } },
        take: 10
      }),
      prisma.invoice.findMany({
        where: {
          agencyId,
          status: { notIn: ['PAID', 'CANCELLED'] },
          dueDate: { gte: now, lte: in7Days }
        },
        select: { id: true, invoiceNumber: true, amountDue: true, currency: true, dueDate: true, customer: { select: { firstName: true, lastName: true } } },
        take: 10
      }),
      prisma.lead.findMany({
        where: {
          agencyId,
          followUpDate: { lt: now },
          status: { notIn: ['BOOKED', 'LOST'] }
        },
        select: { id: true, firstName: true, lastName: true, followUpDate: true, destination: true },
        take: 10
      }),
      prisma.booking.findMany({
        where: {
          agencyId,
          departureDate: { gte: now, lte: in7Days },
          status: { in: ['CONFIRMED'] }
        },
        select: { id: true, bookingNumber: true, title: true, departureDate: true, customer: { select: { firstName: true, lastName: true } } },
        take: 10
      }),
      prisma.invoice.count({
        where: {
          agencyId,
          status: { in: ['DRAFT', 'SENT', 'PARTIAL'] },
          amountDue: { gt: 0 }
        }
      })
    ])

    for (const inv of overdueInvoices) {
      notifications.push({
        id: `overdue-${inv.id}`,
        type: 'error',
        title: `Invoice Overdue: ${inv.invoiceNumber}`,
        message: `${inv.customer?.firstName} ${inv.customer?.lastName} — ${inv.currency} ${inv.amountDue.toLocaleString()} due ${new Date(inv.dueDate).toLocaleDateString()}`,
        link: 'invoices',
        linkId: inv.id,
        createdAt: inv.dueDate
      })
    }

    for (const inv of dueSoonInvoices) {
      const daysLeft = Math.ceil((new Date(inv.dueDate) - now) / (1000 * 60 * 60 * 24))
      notifications.push({
        id: `due-soon-${inv.id}`,
        type: 'warning',
        title: `Invoice Due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}: ${inv.invoiceNumber}`,
        message: `${inv.customer?.firstName} ${inv.customer?.lastName} — ${inv.currency} ${inv.amountDue.toLocaleString()}`,
        link: 'invoices',
        linkId: inv.id,
        createdAt: inv.dueDate
      })
    }

    for (const lead of followUpLeads) {
      notifications.push({
        id: `followup-${lead.id}`,
        type: 'info',
        title: `Follow-up Due: ${lead.firstName} ${lead.lastName}`,
        message: `${lead.destination || 'No destination set'} — scheduled ${new Date(lead.followUpDate).toLocaleDateString()}`,
        link: 'leads',
        linkId: lead.id,
        createdAt: lead.followUpDate
      })
    }

    for (const bk of upcomingBookings) {
      const daysLeft = Math.ceil((new Date(bk.departureDate) - now) / (1000 * 60 * 60 * 24))
      notifications.push({
        id: `departure-${bk.id}`,
        type: 'success',
        title: `Departure in ${daysLeft} day${daysLeft === 1 ? '' : 's'}: ${bk.bookingNumber}`,
        message: `${bk.customer?.firstName} ${bk.customer?.lastName} — ${bk.title}`,
        link: 'bookings',
        linkId: bk.id,
        createdAt: bk.departureDate
      })
    }

    notifications.sort((a, b) => {
      const order = { error: 0, warning: 1, info: 2, success: 3 }
      return order[a.type] - order[b.type]
    })

    res.json({ notifications, count: notifications.length, unpaidCount: unpaidInvoices })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
