import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import Stripe from 'stripe'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function seedSuperAdmin() {
  const maxAttempts = 5
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { default: prismaClient } = await import('./lib/prisma.js')
      const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@travelcrm.com'
      const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@2025!'
      const existing = await prismaClient.superAdmin.findUnique({ where: { email } })
      if (!existing) {
        const hashed = await bcrypt.hash(password, 12)
        await prismaClient.superAdmin.create({
          data: { email, password: hashed, name: 'Platform Admin' }
        })
        console.log(`✅ Super admin created: ${email}`)
      } else {
        console.log(`Super admin ready: ${email}`)
      }
      return
    } catch (err) {
      console.error(`Seed attempt ${attempt}/${maxAttempts} failed: ${err.message}`)
      if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 3000 * attempt))
    }
  }
  console.log('Seed skipped after retries — super admin may already exist')
}

if (process.env.NODE_ENV === 'production') {
  seedSuperAdmin().catch(() => {})
}

import prisma from './lib/prisma.js'
import authRoutes from './routes/auth.js'
import leadRoutes from './routes/leads.js'
import customerRoutes from './routes/customers.js'
import itineraryRoutes from './routes/itineraries.js'
import quotationRoutes from './routes/quotations.js'
import bookingRoutes from './routes/bookings.js'
import invoiceRoutes from './routes/invoices.js'
import supplierRoutes from './routes/suppliers.js'
import userRoutes from './routes/users.js'
import reportRoutes from './routes/reports.js'
import automationRoutes from './routes/automations.js'
import settingsRoutes from './routes/settings.js'
import searchRoutes from './routes/search.js'
import notificationRoutes from './routes/notifications.js'
import uploadRoutes from './routes/uploads.js'
import superAdminRoutes from './routes/superAdmin.js'
import commissionRoutes from './routes/commissions.js'

const app = express()
const PORT = process.env.PORT || process.env.API_PORT || 3001

// Stripe webhook MUST be registered before express.json()
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  app.post('/api/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      const sig = req.headers['stripe-signature']
      let event
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
      } catch (err) {
        console.error('Webhook signature error:', err.message)
        return res.status(400).send(`Webhook Error: ${err.message}`)
      }

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object
        const invoiceId = session.metadata?.invoiceId
        if (invoiceId) {
          const amountPaid = session.amount_total / 100
          const inv = await prisma.invoice.findUnique({ where: { id: invoiceId } })
          if (inv) {
            const newPaid = inv.amountPaid + amountPaid
            const newDue = Math.max(0, inv.total - newPaid)
            await prisma.invoice.update({
              where: { id: invoiceId },
              data: {
                amountPaid: newPaid,
                amountDue: newDue,
                status: newDue <= 0 ? 'PAID' : 'PARTIAL',
                stripePaymentIntentId: session.payment_intent
              }
            })
            await prisma.invoicePayment.create({
              data: {
                invoiceId,
                amount: amountPaid,
                method: 'STRIPE',
                reference: session.payment_intent || session.id,
                notes: 'Stripe online payment'
              }
            })
          }
        }
      }
      res.json({ received: true })
    }
  )
}

app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(cors({ origin: true, credentials: true }))
app.use(compression())
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/health', (req, res) => res.json({ status: 'ok' }))
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }))

app.use('/api/auth', authRoutes)
app.use('/api/leads', leadRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/itineraries', itineraryRoutes)
app.use('/api/quotations', quotationRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/users', userRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/automations', automationRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/uploads', uploadRoutes)
app.use('/api/super-admin', superAdminRoutes)
app.use('/api/commissions', commissionRoutes)

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Serve built frontend in production
const distPath = path.join(__dirname, '../dist')
if (process.env.NODE_ENV === 'production' || process.env.SERVE_FRONTEND === 'true') {
  app.use(express.static(distPath))
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(distPath, 'index.html'))
    }
  })
}

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Server running on port ${PORT}`)
})

export default app
