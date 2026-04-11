import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'

const JWT_SECRET = process.env.JWT_SECRET || 'travelcrm-secret-key-change-in-production'

export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

export const generateSuperAdminToken = (superAdminId) => {
  return jwt.sign({ superAdminId }, JWT_SECRET, { expiresIn: '7d' })
}

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { agency: true }
    })
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' })
    }
    req.user = user
    req.agencyId = user.agencyId
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export const authenticateSuperAdmin = async (req, res, next) => {
  try {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    if (!decoded.superAdminId) {
      return res.status(403).json({ error: 'Super admin access required' })
    }
    const sa = await prisma.superAdmin.findUnique({ where: { id: decoded.superAdminId } })
    if (!sa) return res.status(401).json({ error: 'Super admin not found' })
    req.superAdmin = sa
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }
  next()
}
