import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Find demo agency
  let agency = await prisma.agency.findFirst({ where: { OR: [{ slug: { startsWith: 'gcit-travel-agency' } }, { slug: { startsWith: 'demo-travel-agency' } }] } })
  if (!agency) {
    console.log('No agency found. Please register first via the UI at http://localhost:5000')
    return
  }

  console.log('Seeding demo data for agency:', agency.name)

  // Get admin user
  const admin = await prisma.user.findFirst({ where: { agencyId: agency.id } })
  if (!admin) { console.log('No users found.'); return }

  // Create team members
  const agent1 = await prisma.user.upsert({
    where: { agencyId_email: { agencyId: agency.id, email: 'sarah@demo.com' } },
    update: {},
    create: {
      email: 'sarah@demo.com',
      password: bcrypt.hashSync('demo123', 10),
      firstName: 'Sarah', lastName: 'Johnson', role: 'AGENT',
      commissionRate: 5.0, agencyId: agency.id
    }
  })

  const agent2 = await prisma.user.upsert({
    where: { agencyId_email: { agencyId: agency.id, email: 'mike@demo.com' } },
    update: {},
    create: {
      email: 'mike@demo.com',
      password: bcrypt.hashSync('demo123', 10),
      firstName: 'Mike', lastName: 'Davis', role: 'AGENT',
      commissionRate: 4.5, agencyId: agency.id
    }
  })

  // Create suppliers
  const hotel1 = await prisma.supplier.upsert({
    where: { id: 'sup-hotel-1' },
    update: {},
    create: {
      id: 'sup-hotel-1', name: 'Grand Hyatt Tokyo', type: 'HOTEL',
      country: 'Japan', contactPerson: 'Tanaka San',
      email: 'reservations@grandhyatttokyo.com', phone: '+81-3-4333-1234',
      rating: 5, currency: 'JPY', agencyId: agency.id
    }
  })

  const airline1 = await prisma.supplier.upsert({
    where: { id: 'sup-airline-1' },
    update: {},
    create: {
      id: 'sup-airline-1', name: 'Japan Airlines', type: 'AIRLINE',
      country: 'Japan', contactPerson: 'Agency Desk',
      email: 'agency@jal.co.jp', phone: '+81-3-5460-3084',
      rating: 4, currency: 'JPY', agencyId: agency.id
    }
  })

  const tour1 = await prisma.supplier.upsert({
    where: { id: 'sup-tour-1' },
    update: {},
    create: {
      id: 'sup-tour-1', name: 'Dubai Desert Safari Tours', type: 'TOUR_OPERATOR',
      country: 'UAE', contactPerson: 'Ahmed Al Rashid',
      email: 'bookings@dubaisafari.ae', phone: '+971-4-224-2131',
      rating: 4, currency: 'AED', agencyId: agency.id
    }
  })

  // Create customers
  const customers = await Promise.all([
    prisma.customer.upsert({ where: { id: 'cust-1' }, update: {}, create: {
      id: 'cust-1', firstName: 'James', lastName: 'Wilson', email: 'james@example.com',
      phone: '+1-555-0101', nationality: 'American',
      passportNumber: 'US12345678', passportExpiry: '2028-05-15',
      dateOfBirth: '1985-03-22', agencyId: agency.id
    }}),
    prisma.customer.upsert({ where: { id: 'cust-2' }, update: {}, create: {
      id: 'cust-2', firstName: 'Emma', lastName: 'Thompson', email: 'emma@example.com',
      phone: '+44-7911-123456', nationality: 'British',
      passportNumber: 'GB98765432', passportExpiry: '2027-09-30',
      dateOfBirth: '1990-07-14', agencyId: agency.id
    }}),
    prisma.customer.upsert({ where: { id: 'cust-3' }, update: {}, create: {
      id: 'cust-3', firstName: 'Mohamed', lastName: 'Al-Rashid', email: 'mo@example.com',
      phone: '+971-50-1234567', nationality: 'Emirati',
      passportNumber: 'AE11223344', passportExpiry: '2029-01-20',
      agencyId: agency.id
    }}),
    prisma.customer.upsert({ where: { id: 'cust-4' }, update: {}, create: {
      id: 'cust-4', firstName: 'Sophie', lastName: 'Dubois', email: 'sophie@example.com',
      phone: '+33-6-12345678', nationality: 'French',
      passportNumber: 'FR55667788', passportExpiry: '2026-11-10',
      agencyId: agency.id
    }}),
  ])

  // Create leads
  const leads = await Promise.all([
    prisma.lead.upsert({ where: { id: 'lead-1' }, update: {}, create: {
      id: 'lead-1', firstName: 'Robert', lastName: 'Brown', email: 'robert@example.com',
      phone: '+1-555-0202', source: 'WEBSITE', status: 'NEW',
      destination: 'Maldives', travelDates: 'August 2026', numTravelers: 2,
      budget: 8000, currency: 'USD', agencyId: agency.id, assignedToId: agent1.id
    }}),
    prisma.lead.upsert({ where: { id: 'lead-2' }, update: {}, create: {
      id: 'lead-2', firstName: 'Anna', lastName: 'Müller', email: 'anna@example.com',
      phone: '+49-30-12345678', source: 'REFERRAL', status: 'CONTACTED',
      destination: 'Japan - Cherry Blossom Tour', travelDates: 'March 2027',
      numTravelers: 4, budget: 15000, currency: 'USD', agencyId: agency.id, assignedToId: agent2.id
    }}),
    prisma.lead.upsert({ where: { id: 'lead-3' }, update: {}, create: {
      id: 'lead-3', firstName: 'Carlos', lastName: 'Rivera', email: 'carlos@example.com',
      phone: '+34-91-1234567', source: 'WHATSAPP', status: 'PROPOSAL_SENT',
      destination: 'Dubai & Abu Dhabi', travelDates: 'December 2026',
      numTravelers: 6, budget: 20000, currency: 'USD', agencyId: agency.id, assignedToId: agent1.id
    }}),
    prisma.lead.upsert({ where: { id: 'lead-4' }, update: {}, create: {
      id: 'lead-4', firstName: 'Yuki', lastName: 'Tanaka', email: 'yuki@example.com',
      phone: '+81-80-1234-5678', source: 'SOCIAL_MEDIA', status: 'NEGOTIATING',
      destination: 'European Tour', travelDates: 'July 2026',
      numTravelers: 2, budget: 12000, currency: 'USD', agencyId: agency.id, assignedToId: admin.id
    }}),
    prisma.lead.upsert({ where: { id: 'lead-5' }, update: {}, create: {
      id: 'lead-5', firstName: 'Patricia', lastName: 'O\'Brien', email: 'pat@example.com',
      phone: '+1-555-0303', source: 'EMAIL', status: 'BOOKED',
      destination: 'Thailand Honeymoon', travelDates: 'May 2026',
      numTravelers: 2, budget: 6000, currency: 'USD', agencyId: agency.id, assignedToId: agent2.id
    }}),
    prisma.lead.upsert({ where: { id: 'lead-6' }, update: {}, create: {
      id: 'lead-6', firstName: 'David', lastName: 'Lee', email: 'david@example.com',
      phone: '+1-555-0404', source: 'WALK_IN', status: 'LOST',
      destination: 'Iceland', travelDates: 'January 2026',
      numTravelers: 3, budget: 9000, currency: 'USD', agencyId: agency.id
    }}),
    prisma.lead.upsert({ where: { id: 'lead-7' }, update: {}, create: {
      id: 'lead-7', firstName: 'Fatima', lastName: 'Hassan', email: 'fatima@example.com',
      phone: '+971-55-9876543', source: 'PHONE', status: 'NEW',
      destination: 'Paris & Rome', travelDates: 'October 2026',
      numTravelers: 2, budget: 10000, currency: 'USD', agencyId: agency.id, assignedToId: agent1.id
    }}),
  ])

  // Create itinerary
  const itin = await prisma.itinerary.upsert({ where: { id: 'itin-1' }, update: {}, create: {
    id: 'itin-1', title: '7-Day Japan Discovery', destination: 'Japan',
    duration: 7, description: 'Experience the perfect blend of ancient tradition and futuristic innovation. Visit Tokyo, Kyoto and Osaka.',
    agencyId: agency.id,
    items: {
      create: [
        { type: 'FLIGHT', dayNumber: 1, title: 'Arrival Flight to Tokyo', description: 'International flight to Tokyo Narita', location: 'Narita Airport', price: 1200, currency: 'USD', sortOrder: 1 },
        { type: 'HOTEL', dayNumber: 1, title: 'Check-in Grand Hyatt Tokyo', description: '3 nights in Deluxe Room', location: 'Shinjuku, Tokyo', price: 900, currency: 'USD', sortOrder: 2 },
        { type: 'ACTIVITY', dayNumber: 2, title: 'Tokyo City Tour', description: 'Shibuya, Harajuku, Meiji Shrine', location: 'Tokyo', price: 150, currency: 'USD', sortOrder: 3 },
        { type: 'TRANSFER', dayNumber: 4, title: 'Shinkansen to Kyoto', description: 'Bullet train experience', location: 'Tokyo → Kyoto', price: 180, currency: 'USD', sortOrder: 4 },
        { type: 'HOTEL', dayNumber: 4, title: 'Traditional Ryokan Stay', description: '2 nights in Kyoto Ryokan', location: 'Kyoto', price: 600, currency: 'USD', sortOrder: 5 },
        { type: 'ACTIVITY', dayNumber: 5, title: 'Kyoto Temples & Geisha District', description: 'Fushimi Inari, Gion', location: 'Kyoto', price: 120, currency: 'USD', sortOrder: 6 },
        { type: 'TRANSFER', dayNumber: 6, title: 'Kyoto to Osaka', description: 'Train transfer', location: 'Kyoto → Osaka', price: 30, currency: 'USD', sortOrder: 7 },
        { type: 'ACTIVITY', dayNumber: 6, title: 'Osaka Food Tour', description: 'Street food & Dotonbori', location: 'Osaka', price: 100, currency: 'USD', sortOrder: 8 },
        { type: 'FLIGHT', dayNumber: 7, title: 'Departure Flight', description: 'Return international flight', location: 'Osaka Kansai Airport', price: 1200, currency: 'USD', sortOrder: 9 },
      ]
    }
  }})

  // Create a quotation
  const quote = await prisma.quotation.upsert({ where: { id: 'quote-1' }, update: {}, create: {
    id: 'quote-1', quoteNumber: 'QUO-2026-001',
    title: '7-Day Japan Discovery — 2 Pax', currency: 'USD',
    subtotal: 4480, discount: 200, tax: 0, total: 4280,
    status: 'ACCEPTED', validUntil: new Date('2026-06-30'),
    notes: 'Includes flights, hotels, transfers, and guided tours.',
    leadId: leads[4].id, itineraryId: itin.id, createdById: agent2.id, agencyId: agency.id,
    items: {
      create: [
        { type: 'flight', description: 'Return International Flights (2 Pax)', quantity: 2, unitPrice: 1200, total: 2400, sortOrder: 1 },
        { type: 'hotel', description: '5 Nights Accommodation', quantity: 5, unitPrice: 180, total: 900, sortOrder: 2 },
        { type: 'service', description: 'Guided Tours & Activities', quantity: 1, unitPrice: 680, total: 680, sortOrder: 3 },
        { type: 'service', description: 'Airport Transfers', quantity: 4, unitPrice: 50, total: 200, sortOrder: 4 },
        { type: 'service', description: 'Travel Insurance', quantity: 2, unitPrice: 150, total: 300, sortOrder: 5 },
      ]
    }
  }})

  // Create booking
  const booking = await prisma.booking.upsert({ where: { id: 'bk-1' }, update: {}, create: {
    id: 'bk-1', bookingNumber: 'BK-2026-001',
    title: '7-Day Japan Discovery', status: 'CONFIRMED',
    totalAmount: 4280, paidAmount: 2000, currency: 'USD',
    paymentStatus: 'PARTIAL',
    departureDate: new Date('2026-05-10'), returnDate: new Date('2026-05-17'),
    customerId: customers[0].id, quotationId: quote.id, agentId: agent2.id, agencyId: agency.id,
    notes: 'Honeymoon package. Arrange surprise room decoration on arrival.'
  }})

  await prisma.booking.upsert({ where: { id: 'bk-2' }, update: {}, create: {
    id: 'bk-2', bookingNumber: 'BK-2026-002',
    title: 'Dubai & Abu Dhabi Family Trip', status: 'CONFIRMED',
    totalAmount: 18500, paidAmount: 18500, currency: 'USD',
    paymentStatus: 'PAID',
    departureDate: new Date('2026-06-05'), returnDate: new Date('2026-06-12'),
    customerId: customers[2].id, agentId: agent1.id, agencyId: agency.id,
  }})

  await prisma.booking.upsert({ where: { id: 'bk-3' }, update: {}, create: {
    id: 'bk-3', bookingNumber: 'BK-2025-089',
    title: 'Maldives Luxury Escape', status: 'COMPLETED',
    totalAmount: 9200, paidAmount: 9200, currency: 'USD',
    paymentStatus: 'PAID',
    departureDate: new Date('2025-12-20'), returnDate: new Date('2025-12-27'),
    customerId: customers[1].id, agentId: agent2.id, agencyId: agency.id,
  }})

  // Create invoices
  await prisma.invoice.upsert({ where: { id: 'inv-1' }, update: {}, create: {
    id: 'inv-1', invoiceNumber: 'INV-2026-001',
    subtotal: 4280, discount: 0, tax: 0, total: 4280,
    amountPaid: 2000, amountDue: 2280, currency: 'USD',
    status: 'PARTIAL', dueDate: new Date('2026-04-30'),
    customerId: customers[0].id, bookingId: booking.id, agencyId: agency.id,
    items: {
      create: [
        { description: 'Japan Package - Balance Due', quantity: 1, unitPrice: 4280, total: 4280 }
      ]
    },
    payments: {
      create: [{
        amount: 2000, method: 'BANK_TRANSFER', reference: 'TXN-20260310-001',
        notes: 'Initial deposit 50%'
      }]
    }
  }})

  await prisma.invoice.upsert({ where: { id: 'inv-2' }, update: {}, create: {
    id: 'inv-2', invoiceNumber: 'INV-2026-002',
    subtotal: 18500, discount: 500, tax: 0, total: 18000,
    amountPaid: 18000, amountDue: 0, currency: 'USD',
    status: 'PAID', dueDate: new Date('2026-05-15'),
    customerId: customers[2].id, agencyId: agency.id,
    items: {
      create: [
        { description: 'Dubai & Abu Dhabi Family Package', quantity: 1, unitPrice: 18500, total: 18500 }
      ]
    },
    payments: {
      create: [{ amount: 18000, method: 'CREDIT_CARD', reference: 'STRIPE-PI-001' }]
    }
  }})

  // Create automations
  await prisma.automationTemplate.upsert({ where: { id: 'auto-1' }, update: {}, create: {
    id: 'auto-1', name: 'Welcome New Lead',
    trigger: 'lead_created', channel: 'email', delayDays: 0,
    subject: 'Thank you for your inquiry — {{agency_name}}',
    body: 'Dear {{first_name}},\n\nThank you for reaching out to {{agency_name}}. We will be in touch within 24 hours.\n\nBest regards,\n{{agency_name}} Team',
    isActive: true, agencyId: agency.id
  }})

  await prisma.automationTemplate.upsert({ where: { id: 'auto-2' }, update: {}, create: {
    id: 'auto-2', name: 'Pre-Trip Reminder',
    trigger: 'pre_trip_reminder', channel: 'whatsapp', delayDays: -3,
    body: 'Hi {{first_name}}! Your trip to {{destination}} is in 3 days. Please ensure your travel documents are ready. Need help? Call us anytime! - {{agency_name}}',
    isActive: true, agencyId: agency.id
  }})

  console.log('✅ Seed complete! Demo data created successfully.')
  console.log('   - 2 agents (sarah@demo.com, mike@demo.com / demo123)')
  console.log('   - 4 customers')
  console.log('   - 7 leads (various statuses)')
  console.log('   - 1 itinerary (7-day Japan)')
  console.log('   - 1 quotation (accepted)')
  console.log('   - 3 bookings')
  console.log('   - 2 invoices')
  console.log('   - 3 suppliers')
  console.log('   - 2 automation templates')
}

main().catch(console.error).finally(() => prisma.$disconnect())
