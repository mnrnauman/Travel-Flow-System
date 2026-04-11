import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

// List leads
router.get('/', async (req, res) => {
  try {
    const { status, source, assignedTo, search, page = 1, limit = 50 } = req.query
    const where = { agencyId: req.agencyId }
    if (status) where.status = status
    if (source) where.source = source
    if (assignedTo) where.assignedToId = assignedTo
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
          customer: { select: { id: true, firstName: true, lastName: true } },
          activities: { orderBy: { createdAt: 'desc' }, take: 1 },
          _count: { select: { quotations: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: Number(limit)
      }),
      prisma.lead.count({ where })
    ])

    res.json({ leads, total, page: Number(page), limit: Number(limit) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get lead
router.get('/:id', async (req, res) => {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: req.params.id, agencyId: req.agencyId },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        customer: true,
        activities: { orderBy: { createdAt: 'desc' } },
        quotations: { orderBy: { createdAt: 'desc' } }
      }
    })
    if (!lead) return res.status(404).json({ error: 'Lead not found' })
    res.json(lead)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create lead
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, source, destination, travelDates, numTravelers, budget, currency, notes, assignedToId, tags } = req.body
    const lead = await prisma.lead.create({
      data: {
        agencyId: req.agencyId,
        firstName, lastName, email, phone, source,
        destination, travelDates, numTravelers: numTravelers ? Number(numTravelers) : null,
        budget: budget ? Number(budget) : null,
        currency: currency || 'USD', notes,
        assignedToId, tags: tags || [],
        activities: {
          create: { type: 'created', note: 'Lead created' }
        }
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } }
      }
    })
    res.status(201).json(lead)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Update lead
router.put('/:id', async (req, res) => {
  try {
    const existing = await prisma.lead.findFirst({ where: { id: req.params.id, agencyId: req.agencyId } })
    if (!existing) return res.status(404).json({ error: 'Lead not found' })

    const { firstName, lastName, email, phone, source, status, destination, travelDates, numTravelers, budget, currency, notes, assignedToId, tags, followUpDate } = req.body

    const updates = { firstName, lastName, email, phone, source, status, destination, travelDates, notes, currency, tags }
    if (numTravelers !== undefined) updates.numTravelers = numTravelers ? Number(numTravelers) : null
    if (budget !== undefined) updates.budget = budget ? Number(budget) : null
    if (assignedToId !== undefined) updates.assignedToId = assignedToId
    if (followUpDate !== undefined) updates.followUpDate = followUpDate ? new Date(followUpDate) : null

    if (status && status !== existing.status) {
      updates.activities = {
        create: { type: 'status_change', note: `Status changed from ${existing.status} to ${status}` }
      }
      if (status === 'BOOKED') updates.convertedAt = new Date()
    }

    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: updates,
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } }
      }
    })
    res.json(lead)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Add activity
router.post('/:id/activities', async (req, res) => {
  try {
    const { type, note } = req.body
    const activity = await prisma.leadActivity.create({
      data: { leadId: req.params.id, type, note }
    })
    res.status(201).json(activity)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete lead
router.delete('/:id', async (req, res) => {
  try {
    await prisma.leadActivity.deleteMany({ where: { leadId: req.params.id } })
    await prisma.lead.deleteMany({ where: { id: req.params.id, agencyId: req.agencyId } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
