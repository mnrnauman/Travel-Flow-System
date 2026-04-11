import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const { q, limit = 8 } = req.query
    if (!q || q.trim().length < 2) return res.json({ results: [] })

    const search = q.trim()
    const n = Number(limit)
    const agencyId = req.agencyId

    const [leads, customers, bookings, invoices] = await Promise.all([
      prisma.lead.findMany({
        where: {
          agencyId,
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { destination: { contains: search, mode: 'insensitive' } },
          ]
        },
        take: n,
        select: { id: true, firstName: true, lastName: true, email: true, status: true, destination: true }
      }),
      prisma.customer.findMany({
        where: {
          agencyId,
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ]
        },
        take: n,
        select: { id: true, firstName: true, lastName: true, email: true, phone: true }
      }),
      prisma.booking.findMany({
        where: {
          agencyId,
          OR: [
            { bookingNumber: { contains: search, mode: 'insensitive' } },
            { title: { contains: search, mode: 'insensitive' } },
            { destination: { contains: search, mode: 'insensitive' } },
          ]
        },
        take: n,
        select: { id: true, bookingNumber: true, title: true, status: true, totalAmount: true, currency: true }
      }),
      prisma.invoice.findMany({
        where: {
          agencyId,
          OR: [
            { invoiceNumber: { contains: search, mode: 'insensitive' } },
          ]
        },
        take: n,
        select: { id: true, invoiceNumber: true, total: true, status: true, currency: true, customer: { select: { firstName: true, lastName: true } } }
      }),
    ])

    const results = [
      ...leads.map(l => ({ type: 'lead', id: l.id, title: `${l.firstName} ${l.lastName}`, sub: l.destination || l.email || '', badge: l.status })),
      ...customers.map(c => ({ type: 'customer', id: c.id, title: `${c.firstName} ${c.lastName}`, sub: c.email || c.phone || '' })),
      ...bookings.map(b => ({ type: 'booking', id: b.id, title: b.title, sub: b.bookingNumber, badge: b.status })),
      ...invoices.map(i => ({ type: 'invoice', id: i.id, title: i.invoiceNumber, sub: i.customer ? `${i.customer.firstName} ${i.customer.lastName}` : '', badge: i.status })),
    ]

    res.json({ results })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
