import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = path.join(__dirname, '../../uploads')
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) cb(null, true)
    else cb(new Error('File type not allowed'))
  }
})

const router = Router()
router.use(authenticate)

// Upload a document
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    const { customerId, bookingId, name, type } = req.body

    const doc = await prisma.document.create({
      data: {
        agencyId: req.agencyId,
        customerId: customerId || null,
        bookingId: bookingId || null,
        name: name || req.file.originalname,
        type: type || 'other',
        url: `/uploads/${req.file.filename}`,
        size: req.file.size,
        mimeType: req.file.mimetype,
        uploadedById: req.user.id
      }
    })
    res.status(201).json(doc)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// List documents
router.get('/', async (req, res) => {
  try {
    const { customerId, bookingId } = req.query
    const where = { agencyId: req.agencyId }
    if (customerId) where.customerId = customerId
    if (bookingId) where.bookingId = bookingId

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
    res.json(documents)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete document
router.delete('/:id', async (req, res) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, agencyId: req.agencyId }
    })
    if (!doc) return res.status(404).json({ error: 'Not found' })

    const filePath = path.join(__dirname, '../../', doc.url)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

    await prisma.document.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
