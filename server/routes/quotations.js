import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const { status, leadId } = req.query
    const where = { agencyId: req.agencyId }
    if (status) where.status = status
    if (leadId) where.leadId = leadId

    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        lead: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        items: true,
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(quotations)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const q = await prisma.quotation.findFirst({
      where: { id: req.params.id, agencyId: req.agencyId },
      include: {
        lead: true,
        itinerary: { include: { items: { orderBy: [{ dayNumber: 'asc' }, { sortOrder: 'asc' }] } } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        items: { orderBy: { sortOrder: 'asc' } },
        booking: true
      }
    })
    if (!q) return res.status(404).json({ error: 'Not found' })
    res.json(q)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { leadId, itineraryId, title, currency, validUntil, discount, tax, notes, items } = req.body

    const count = await prisma.quotation.count({ where: { agencyId: req.agencyId } })
    const quoteNumber = `Q-${String(count + 1).padStart(5, '0')}`

    const parsedItems = (items || []).map(i => ({
      description: i.description,
      type: i.type || 'service',
      quantity: Number(i.quantity) || 1,
      unitPrice: Number(i.unitPrice) || 0,
      total: (Number(i.quantity) || 1) * (Number(i.unitPrice) || 0),
      notes: i.notes,
      sortOrder: i.sortOrder || 0
    }))

    const subtotal = parsedItems.reduce((s, i) => s + i.total, 0)
    const discountAmt = Number(discount) || 0
    const taxAmt = Number(tax) || 0
    const total = subtotal - discountAmt + taxAmt

    const q = await prisma.quotation.create({
      data: {
        agencyId: req.agencyId,
        createdById: req.user.id,
        leadId, itineraryId, title, currency: currency || 'USD',
        quoteNumber,
        validUntil: validUntil ? new Date(validUntil) : null,
        subtotal, discount: discountAmt, tax: taxAmt, total, notes,
        items: { create: parsedItems }
      },
      include: { items: true, lead: true }
    })
    res.status(201).json(q)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { title, status, currency, validUntil, discount, tax, notes, items } = req.body
    const updates = { title, status, currency, notes }

    if (validUntil !== undefined) updates.validUntil = validUntil ? new Date(validUntil) : null
    if (status === 'SENT') updates.sentAt = new Date()
    if (status === 'ACCEPTED') updates.acceptedAt = new Date()

    if (items) {
      await prisma.quotationItem.deleteMany({ where: { quotationId: req.params.id } })
      const parsedItems = items.map(i => ({
        quotationId: req.params.id,
        description: i.description,
        type: i.type || 'service',
        quantity: Number(i.quantity) || 1,
        unitPrice: Number(i.unitPrice) || 0,
        total: (Number(i.quantity) || 1) * (Number(i.unitPrice) || 0),
        notes: i.notes,
        sortOrder: i.sortOrder || 0
      }))
      await prisma.quotationItem.createMany({ data: parsedItems })
      const subtotal = parsedItems.reduce((s, i) => s + i.total, 0)
      updates.subtotal = subtotal
      updates.discount = Number(discount) || 0
      updates.tax = Number(tax) || 0
      updates.total = subtotal - (Number(discount) || 0) + (Number(tax) || 0)
    }

    const q = await prisma.quotation.update({
      where: { id: req.params.id },
      data: updates,
      include: { items: true }
    })
    res.json(q)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Convert quotation to booking
router.post('/:id/convert', async (req, res) => {
  try {
    const q = await prisma.quotation.findFirst({
      where: { id: req.params.id, agencyId: req.agencyId },
      include: { lead: true, items: true }
    })
    if (!q) return res.status(404).json({ error: 'Not found' })

    const { customerId, departureDate, returnDate } = req.body
    const count = await prisma.booking.count({ where: { agencyId: req.agencyId } })
    const bookingNumber = `BK-${String(count + 1).padStart(5, '0')}`

    const booking = await prisma.booking.create({
      data: {
        agencyId: req.agencyId,
        quotationId: q.id,
        customerId,
        agentId: req.user.id,
        bookingNumber,
        title: q.title,
        destination: q.lead?.destination,
        departureDate: departureDate ? new Date(departureDate) : null,
        returnDate: returnDate ? new Date(returnDate) : null,
        totalAmount: q.total,
        currency: q.currency,
        status: 'CONFIRMED',
        paymentStatus: 'UNPAID'
      }
    })

    await prisma.quotation.update({ where: { id: q.id }, data: { status: 'ACCEPTED', acceptedAt: new Date() } })
    if (q.leadId) {
      await prisma.lead.update({ where: { id: q.leadId }, data: { status: 'BOOKED', convertedAt: new Date() } })
    }

    res.status(201).json(booking)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.quotationItem.deleteMany({ where: { quotationId: req.params.id } })
    await prisma.quotation.deleteMany({ where: { id: req.params.id, agencyId: req.agencyId } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
