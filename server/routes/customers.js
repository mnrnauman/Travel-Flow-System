import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query
    const where = { agencyId: req.agencyId }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          _count: { select: { bookings: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: Number(limit)
      }),
      prisma.customer.count({ where })
    ])
    res.json({ customers, total })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, agencyId: req.agencyId },
      include: {
        bookings: {
          include: { agent: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' }
        },
        invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
        leads: { orderBy: { createdAt: 'desc' }, take: 5 }
      }
    })
    if (!customer) return res.status(404).json({ error: 'Customer not found' })
    res.json(customer)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const data = req.body
    const customer = await prisma.customer.create({
      data: { ...data, agencyId: req.agencyId }
    })
    res.status(201).json(customer)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const customer = await prisma.customer.updateMany({
      where: { id: req.params.id, agencyId: req.agencyId },
      data: req.body
    })
    res.json(customer)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.customer.deleteMany({ where: { id: req.params.id, agencyId: req.agencyId } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Convert lead to customer
router.post('/from-lead/:leadId', async (req, res) => {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: req.params.leadId, agencyId: req.agencyId }
    })
    if (!lead) return res.status(404).json({ error: 'Lead not found' })
    if (lead.customerId) {
      const existing = await prisma.customer.findUnique({ where: { id: lead.customerId } })
      if (existing) return res.status(400).json({ error: 'Lead already converted to customer', customerId: existing.id })
    }

    const customer = await prisma.customer.create({
      data: {
        agencyId: req.agencyId,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email || undefined,
        phone: lead.phone || undefined,
        notes: lead.notes || undefined,
      }
    })

    await prisma.lead.update({
      where: { id: lead.id },
      data: { customerId: customer.id, status: 'BOOKED' }
    })

    res.status(201).json(customer)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
