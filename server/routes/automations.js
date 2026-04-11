import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const templates = await prisma.automationTemplate.findMany({
      where: { agencyId: req.agencyId },
      orderBy: { createdAt: 'desc' }
    })
    res.json(templates)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const template = await prisma.automationTemplate.create({
      data: { ...req.body, agencyId: req.agencyId }
    })
    res.status(201).json(template)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const template = await prisma.automationTemplate.updateMany({
      where: { id: req.params.id, agencyId: req.agencyId },
      data: req.body
    })
    res.json(template)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.automationTemplate.deleteMany({ where: { id: req.params.id, agencyId: req.agencyId } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
