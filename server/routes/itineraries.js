import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// Public shared itinerary
router.get('/share/:token', async (req, res) => {
  try {
    const itinerary = await prisma.itinerary.findUnique({
      where: { shareToken: req.params.token },
      include: {
        items: {
          include: { supplier: { select: { name: true, type: true } } },
          orderBy: [{ dayNumber: 'asc' }, { sortOrder: 'asc' }]
        },
        agency: { select: { name: true, logo: true, email: true, phone: true } }
      }
    })
    if (!itinerary) return res.status(404).json({ error: 'Itinerary not found' })
    res.json(itinerary)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const { search } = req.query
    const where = { agencyId: req.agencyId }
    if (search) where.title = { contains: search, mode: 'insensitive' }

    const itineraries = await prisma.itinerary.findMany({
      where,
      include: {
        _count: { select: { items: true, quotations: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(itineraries)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const itinerary = await prisma.itinerary.findFirst({
      where: { id: req.params.id, agencyId: req.agencyId },
      include: {
        items: {
          include: { supplier: { select: { id: true, name: true, type: true } } },
          orderBy: [{ dayNumber: 'asc' }, { sortOrder: 'asc' }]
        }
      }
    })
    if (!itinerary) return res.status(404).json({ error: 'Not found' })
    res.json(itinerary)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { title, destination, duration, description, items } = req.body
    const itinerary = await prisma.itinerary.create({
      data: {
        agencyId: req.agencyId,
        title, destination, duration: Number(duration), description,
        items: items ? {
          create: items.map((item, i) => ({
            ...item,
            price: Number(item.price) || 0,
            sortOrder: i
          }))
        } : undefined
      },
      include: { items: true }
    })
    res.status(201).json(itinerary)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { title, destination, duration, description, isPublic, items } = req.body

    const itinerary = await prisma.itinerary.updateMany({
      where: { id: req.params.id, agencyId: req.agencyId },
      data: { title, destination, duration: duration ? Number(duration) : undefined, description, isPublic }
    })

    if (items) {
      await prisma.itineraryItem.deleteMany({ where: { itineraryId: req.params.id } })
      await prisma.itineraryItem.createMany({
        data: items.map((item, i) => ({
          ...item,
          itineraryId: req.params.id,
          price: Number(item.price) || 0,
          sortOrder: i
        }))
      })
    }

    const updated = await prisma.itinerary.findUnique({
      where: { id: req.params.id },
      include: { items: { orderBy: [{ dayNumber: 'asc' }, { sortOrder: 'asc' }] } }
    })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.itineraryItem.deleteMany({ where: { itineraryId: req.params.id } })
    await prisma.itinerary.deleteMany({ where: { id: req.params.id, agencyId: req.agencyId } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
