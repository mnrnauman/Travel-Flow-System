import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const { type, search } = req.query
    const where = { agencyId: req.agencyId }
    if (type) where.type = type
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    const suppliers = await prisma.supplier.findMany({
      where,
      include: { _count: { select: { contracts: true } } },
      orderBy: { name: 'asc' }
    })
    res.json(suppliers)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const supplier = await prisma.supplier.findFirst({
      where: { id: req.params.id, agencyId: req.agencyId },
      include: { contracts: { orderBy: { createdAt: 'desc' } } }
    })
    if (!supplier) return res.status(404).json({ error: 'Not found' })
    res.json(supplier)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const supplier = await prisma.supplier.create({
      data: { ...req.body, agencyId: req.agencyId }
    })
    res.status(201).json(supplier)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const supplier = await prisma.supplier.updateMany({
      where: { id: req.params.id, agencyId: req.agencyId },
      data: req.body
    })
    res.json(supplier)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.supplierContract.deleteMany({ where: { supplierId: req.params.id } })
    await prisma.supplier.deleteMany({ where: { id: req.params.id, agencyId: req.agencyId } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Contracts
router.post('/:id/contracts', async (req, res) => {
  try {
    const contract = await prisma.supplierContract.create({
      data: { ...req.body, supplierId: req.params.id }
    })
    res.status(201).json(contract)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
