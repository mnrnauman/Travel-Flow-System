# Travel Agency CRM System

## Overview

A full-featured **Travel Agency CRM SaaS** system — multi-tenant, production-ready. Multiple travel agencies can register and manage their own isolated workspace. Built with Node.js + Express backend and React + Vite frontend.

## Architecture

- **Backend**: Node.js + Express 4 + Prisma ORM 7 (port 3001)
- **Frontend**: React 18 + TypeScript + Vite (port 5000)
- **Database**: PostgreSQL (Replit managed via DATABASE_URL)
- **Auth**: JWT + bcrypt, role-based (SUPER_ADMIN/ADMIN/MANAGER/AGENT)
- **Payments**: Stripe (checkout sessions + webhook)
- **Multi-tenant**: All data scoped by agencyId from JWT

## Running

- Backend workflow: `node server/index.js` → port 3001
- Frontend workflow: `npm run dev` → port 5000
- Vite proxies `/api/*` → `http://localhost:3001/api/*`

## Project Structure

```
server/
  index.js              # Express app entry, Stripe webhook
  lib/
    prisma.js           # Prisma client with PrismaPg adapter
    stripe.js           # Stripe client (optional)
  middleware/
    auth.js             # JWT auth middleware
  lib/
    email.js            # Nodemailer SMTP helper
  routes/
    auth.js             # Register, login, profile, change password
    leads.js            # Lead CRUD + kanban
    customers.js        # Customer CRUD
    itineraries.js      # Itinerary builder
    quotations.js       # Quotations + line items + convert to booking
    bookings.js         # Booking management
    invoices.js         # Invoices + Stripe payment + record payment
    suppliers.js        # Supplier directory
    users.js            # Team/agent management
    reports.js          # Dashboard stats + sales report
    automations.js      # Email/WhatsApp automation templates
    settings.js         # Agency settings + SMTP test
    search.js           # Global search (leads/customers/bookings/invoices)
    notifications.js    # Dynamic alert notifications
    uploads.js          # Multer file upload + document management
  seed.js               # Demo data seed script

src/
  App.tsx               # Auth-gated SPA routing (all pages registered)
  context/
    AuthContext.tsx     # JWT auth state (exposes setUser for profile updates)
  lib/
    api.ts              # Axios client (proxied /api and /uploads)
  hooks/
    useApi.ts           # Data fetching hooks
  components/
    Layout.tsx          # App shell + sidebar + global search + notification bell
    ui.tsx              # Shared UI components
    Pagination.tsx      # Reusable pagination component
  pages/
    Login.tsx           # Login + register agency
    Dashboard.tsx       # Live stats and pipeline
    Leads.tsx           # List + kanban views + pagination
    Customers.tsx       # Customer management + document upload/management + pagination
    Itineraries.tsx     # Itinerary builder (day-by-day)
    Quotations.tsx      # Quotes with line items + PDF print
    Bookings.tsx        # Booking management
    Invoices.tsx        # Invoices + Stripe + manual payments + PDF print
    Suppliers.tsx       # Supplier directory
    Team.tsx            # Agent management + commissions
    Reports.tsx         # Analytics + agent performance
    Automation.tsx      # Email/WhatsApp templates
    Settings.tsx        # Agency settings (4 tabs: profile/invoice/email/locale)
    Profile.tsx         # User profile + change password
    Calendar.tsx        # Monthly calendar with booking/invoice/follow-up events

prisma/
  schema.prisma         # Full database schema

DEPLOYMENT.md           # Debian/Windows server deployment guide
```

## Key Technical Notes

- Prisma 7.7 requires `PrismaPg` adapter (NOT schema.prisma datasource url)
- Server must listen on `0.0.0.0` for Replit port detection
- Stripe webhook uses raw body parser (registered BEFORE express.json)
- All API routes require JWT auth; all DB queries filter by `agencyId`
- bcryptjs v2 (not v3) is installed

## Environment Variables Required

```env
DATABASE_URL=postgresql://...    # Required
JWT_SECRET=...                   # Required (32+ chars)
STRIPE_SECRET_KEY=sk_live_...    # Optional (Stripe payments)
STRIPE_WEBHOOK_SECRET=whsec_...  # Optional (Stripe webhook)
FRONTEND_URL=https://...         # Optional (Stripe redirect URLs)
```

## Demo Credentials

After running `node server/seed.js`:
- Admin: admin@demo.com / demo123
- Agent: sarah@demo.com / demo123
- Agent: mike@demo.com / demo123

## CRM Features

1. **Lead Management** — Kanban + list, 6 pipeline stages, source tracking, pagination
2. **Customer Profiles** — Passport, DOB, nationality, booking history, document uploads, pagination
3. **Itinerary Builder** — Day-by-day builder with type (flight/hotel/activity/transfer)
4. **Quotation System** — Line items, discount/tax, convert to booking, PDF print
5. **Booking Management** — Status tracking, payment status
6. **Invoice & Payments** — Stripe checkout + manual payment recording + PDF print
7. **Supplier Directory** — Hotels, airlines, tour operators, rating system
8. **Team & Agents** — Role management, commission rates
9. **Reports & Analytics** — Pipeline, revenue, agent performance
10. **Automation** — Email/WhatsApp templates with trigger system
11. **Global Search** — Debounced search across leads, customers, bookings, invoices
12. **Notification Bell** — Real-time alerts (overdue invoices, expiring passports, follow-ups)
13. **Calendar View** — Monthly grid with departures, returns, invoice due dates, follow-ups
14. **Settings** — 4-tab agency settings (profile, invoice/quotation, SMTP email, localization)
15. **User Profile** — Edit personal info + change password
16. **File Uploads** — Per-customer document management (PDF, images, office docs)
