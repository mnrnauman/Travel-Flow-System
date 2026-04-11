import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'
import stripe from '../lib/stripe.js'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const { status, customerId, bookingId } = req.query
    const where = { agencyId: req.agencyId }
    if (status) where.status = status
    if (customerId) where.customerId = customerId
    if (bookingId) where.bookingId = bookingId

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        booking: { select: { bookingNumber: true } },
        payments: true,
        items: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(invoices)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, agencyId: req.agencyId },
      include: {
        customer: true,
        booking: true,
        items: { orderBy: { sortOrder: 'asc' } },
        payments: { orderBy: { paidAt: 'desc' } },
        agency: { select: { name: true, email: true, phone: true, address: true, logo: true } }
      }
    })
    if (!invoice) return res.status(404).json({ error: 'Not found' })
    res.json(invoice)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { bookingId, customerId, currency, dueDate, discount, tax, notes, items } = req.body
    const count = await prisma.invoice.count({ where: { agencyId: req.agencyId } })
    const invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`

    const parsedItems = (items || []).map((i, idx) => ({
      description: i.description,
      quantity: Number(i.quantity) || 1,
      unitPrice: Number(i.unitPrice) || 0,
      total: (Number(i.quantity) || 1) * (Number(i.unitPrice) || 0),
      sortOrder: idx
    }))

    const subtotal = parsedItems.reduce((s, i) => s + i.total, 0)
    const discountAmt = Number(discount) || 0
    const taxAmt = Number(tax) || 0
    const total = subtotal - discountAmt + taxAmt

    const invoice = await prisma.invoice.create({
      data: {
        agencyId: req.agencyId,
        bookingId, customerId,
        invoiceNumber,
        currency: currency || 'USD',
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal, discount: discountAmt, tax: taxAmt,
        total, amountDue: total, amountPaid: 0,
        notes, status: 'DRAFT',
        items: { create: parsedItems }
      },
      include: { items: true, customer: true }
    })
    res.status(201).json(invoice)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { status, dueDate, notes } = req.body
    const updates = {}
    if (status) updates.status = status
    if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null
    if (notes !== undefined) updates.notes = notes
    if (status === 'SENT') updates.sentAt = new Date()
    if (status === 'PAID') updates.paidAt = new Date()

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: updates
    })
    res.json(invoice)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Record payment
router.post('/:id/payments', async (req, res) => {
  try {
    const { amount, method, reference, notes } = req.body
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, agencyId: req.agencyId }
    })
    if (!invoice) return res.status(404).json({ error: 'Not found' })

    const payment = await prisma.invoicePayment.create({
      data: { invoiceId: req.params.id, amount: Number(amount), method, reference, notes }
    })

    const newAmountPaid = invoice.amountPaid + Number(amount)
    const newAmountDue = invoice.total - newAmountPaid
    const newStatus = newAmountDue <= 0 ? 'PAID' : 'PARTIAL'

    await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        amountPaid: newAmountPaid,
        amountDue: Math.max(0, newAmountDue),
        status: newStatus,
        paidAt: newStatus === 'PAID' ? new Date() : undefined
      }
    })

    // Update booking payment status
    if (invoice.bookingId) {
      const booking = await prisma.booking.findUnique({ where: { id: invoice.bookingId } })
      if (booking) {
        const allInvoices = await prisma.invoice.findMany({ where: { bookingId: invoice.bookingId } })
        const totalPaid = allInvoices.reduce((s, i) => s + (i.id === invoice.id ? newAmountPaid : i.amountPaid), 0)
        const paymentStatus = totalPaid >= booking.totalAmount ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID'
        await prisma.booking.update({ where: { id: invoice.bookingId }, data: { paidAmount: totalPaid, paymentStatus } })
      }
    }

    res.status(201).json(payment)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create Stripe payment link
router.post('/:id/stripe-payment', async (req, res) => {
  try {
    if (!stripe) return res.status(400).json({ error: 'Stripe not configured' })
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, agencyId: req.agencyId },
      include: { customer: true, agency: true }
    })
    if (!invoice) return res.status(404).json({ error: 'Not found' })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: invoice.customer.email,
      line_items: [{
        price_data: {
          currency: invoice.currency.toLowerCase(),
          product_data: { name: `Invoice ${invoice.invoiceNumber} - ${invoice.agency.name}` },
          unit_amount: Math.round(invoice.amountDue * 100)
        },
        quantity: 1
      }],
      metadata: { invoiceId: invoice.id, agencyId: req.agencyId },
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/invoices/${invoice.id}?paid=true`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/invoices/${invoice.id}`
    })

    res.json({ url: session.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
