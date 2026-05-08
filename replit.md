# Travel Agency CRM

A multi-tenant Customer Relationship Management (CRM) system for travel agencies. It allows agencies to manage leads, customers, itineraries, quotations, bookings, invoices, and suppliers, with support for automated notifications and commission tracking.

## Architecture

- **Frontend:** React 18 + TypeScript, Vite build system, Tailwind CSS, React Router DOM v6
- **Backend:** Node.js + Express.js REST API
- **Database:** PostgreSQL via Prisma ORM (Replit built-in database)
- **Auth:** JWT tokens + bcrypt password hashing
- **Payments:** Stripe integration
- **Email:** Nodemailer

## Project Structure

```
├── prisma/               # Database schema (no migrations — uses db push)
├── server/               # Express backend (port 3001 in dev)
│   ├── lib/              # Prisma client, Stripe, Email utilities
│   ├── middleware/       # Auth, validation middleware
│   ├── routes/           # API routes (leads, customers, bookings, etc.)
│   └── index.js          # Backend entry point
├── src/                  # React frontend
│   ├── components/       # Reusable UI components (Pagination, ui, Layout)
│   ├── context/          # Auth context
│   ├── pages/            # Page components
│   ├── types/            # TypeScript types
│   └── App.tsx           # Main app routing
├── vite.config.ts        # Vite config (proxies /api → localhost:3001)
└── package.json
```

## Development

The workflow runs both services:
- **Frontend:** `npm run dev` → Vite dev server on port 5000 (with `allowedHosts: true`)
- **Backend:** `node server/index.js` → Express API on port 3001

Vite proxies `/api` and `/uploads` requests to the backend at `localhost:3001`.

Workflow command: `node server/index.js & npm run dev`

## Default Super Admin

- Email: `superadmin@travelcrm.com`
- Password: `SuperAdmin@2025!`

Can be overridden via `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` env vars.

## Production Deployment

- **Target:** Autoscale
- **Build:** `npm run build` (TypeScript compile + Vite bundle + Prisma generate)
- **Run:** `SERVE_FRONTEND=true node server/index.js` (backend serves built frontend)

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (set by Replit)
- `JWT_SECRET` — Secret for JWT token signing
- `STRIPE_SECRET_KEY` — Stripe API key (optional)
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook secret (optional)
- `SMTP_*` — Email configuration (optional)
- `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` — Override default super admin credentials

## Key Features

- Multi-tenant: Super Admin manages agencies; each agency has isolated data
- Lead management with status tracking (List + Kanban views), assignedTo agent + followUpDate fields, overdue follow-up highlighting
- Lead Activity Notes slide-over panel — log calls, emails, WhatsApp, meetings per lead
- Lead → Customer conversion button (BOOKED leads without a customer record)
- WhatsApp click-to-chat button on every lead/customer/supplier with a phone number
- Customer Detail slide-over panel — bookings, invoices, linked leads, spend stats, passport info
- Itinerary builder with print/PDF export button (opens print dialog)
- Quotation builder with linked Lead selector; print/PDF export
- Invoice editing — edit items, discount, tax, due date on existing invoices (PUT /invoices/:id with items array)
- Booking and invoice system with Stripe payment support
- Supplier directory with clickable email/phone/WhatsApp/website links; paginated grid view
- Commission tracking per agent
- Automated notifications/email triggers
- Dashboard with passport expiry alerts, Today's Agenda, Quick Actions, Monthly Revenue chart, Recent Bookings
- Reports with CSV export for bookings and leads
- Global search, notification bell, calendar (departures/returns/follow-ups/invoices/passport expiry)
- Team management with activate/deactivate user toggle

## Backend API (v1.1 + v1.2 + v1.3)

- `GET /api/reports/today` — Today's departures, follow-ups, overdue invoices, recent bookings, expiring passports (next 90 days)
- `GET /api/reports/monthly` — Last 12 months revenue/bookings/leads trend
- `GET /api/reports/export/bookings` — CSV export of bookings
- `GET /api/reports/export/leads` — CSV export of leads
- `POST /api/leads/:id/activities` — Add activity note to a lead (call, email, WhatsApp, meeting)
- `DELETE /api/bookings/:id` — Delete a booking (admin/manager only)
- `GET /api/invoices?search=` — Search invoices by invoice number, customer name, or email
- `PUT /api/invoices/:id` — Full invoice edit (items array → delete+recreate, recalculate totals)
- `POST /api/customers/from-lead/:leadId` — Convert lead to customer, link customerId, set lead status BOOKED
- `GET /api/customers/:id` — Customer detail with bookings, invoices, leads included

## Important Notes

- `Sidebar.tsx` is a dead file — actual sidebar is rendered inline in `Layout.tsx`
- Quotations have a "Convert to Booking" feature via `POST /api/quotations/:id/convert`
- Bookings page has proper pagination (15 per page) with departure countdown in days
- Passport expiry widget on dashboard shows customers with passports expiring in next 90 days (urgent < 30 days shown in red)
- Calendar shows passport expiry events (red = urgent <30 days, amber = within 1 year)
