import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const { status, paymentStatus, search, page = 1, limit = 50 } = req.query
    const where = { agencyId: req.agencyId }
    if (status) where.status = status
    if (paymentStatus) where.paymentStatus = paymentStatus
    if (search) {
      where.OR = [
        { bookingNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { customer: { firstName: { contains: search, mode: 'insensitive' } } },
        { customer: { lastName: { contains: search, mode: 'insensitive' } } },
      ]
    }
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
          agent: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { invoices: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: Number(limit)
      }),
      prisma.booking.count({ where })
    ])
    res.json({ bookings, total })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const booking = await prisma.booking.findFirst({
      where: { id: req.params.id, agencyId: req.agencyId },
      include: {
        customer: true,
        agent: { select: { id: true, firstName: true, lastName: true } },
        quotation: { include: { items: true } },
        invoices: { include: { payments: true, items: true } },
        commissions: { include: { user: { select: { firstName: true, lastName: true } } } }
      }
    })
    if (!booking) return res.status(404).json({ error: 'Not found' })
    res.json(booking)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const {
      customerId, title, destination, departureDate, returnDate,
      numTravelers, totalAmount, paidAmount, currency, status, paymentStatus, agentId, notes
    } = req.body
    if (!customerId || !title || !totalAmount) {
      return res.status(400).json({ error: 'Customer, title and total amount are required' })
    }
    const count = await prisma.booking.count({ where: { agencyId: req.agencyId } })
    const bookingNumber = `BK-${String(count + 1).padStart(4, '0')}`

    const booking = await prisma.booking.create({
      data: {
        agencyId: req.agencyId,
        customerId,
        bookingNumber,
        title,
        destination: destination || null,
        departureDate: departureDate ? new Date(departureDate) : null,
        returnDate: returnDate ? new Date(returnDate) : null,
        numTravelers: Number(numTravelers) || 1,
        totalAmount: Number(totalAmount),
        paidAmount: Number(paidAmount) || 0,
        currency: currency || 'USD',
        status: status || 'CONFIRMED',
        paymentStatus: paymentStatus || 'UNPAID',
        agentId: agentId || null,
        notes: notes || null,
      },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        agent: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { invoices: true } }
      }
    })
    res.status(201).json(booking)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const {
      status, paymentStatus, notes, departureDate, returnDate, numTravelers,
      title, destination, totalAmount, paidAmount, currency, agentId
    } = req.body
    const updates = {}
    if (status !== undefined) updates.status = status
    if (paymentStatus !== undefined) updates.paymentStatus = paymentStatus
    if (notes !== undefined) updates.notes = notes
    if (title !== undefined) updates.title = title
    if (destination !== undefined) updates.destination = destination || null
    if (departureDate !== undefined) updates.departureDate = departureDate ? new Date(departureDate) : null
    if (returnDate !== undefined) updates.returnDate = returnDate ? new Date(returnDate) : null
    if (numTravelers !== undefined) updates.numTravelers = Number(numTravelers)
    if (totalAmount !== undefined) updates.totalAmount = Number(totalAmount)
    if (paidAmount !== undefined) updates.paidAmount = Number(paidAmount)
    if (currency !== undefined) updates.currency = currency
    if (agentId !== undefined) updates.agentId = agentId || null

    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: updates,
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        agent: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { invoices: true } }
      }
    })
    res.json(booking)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
