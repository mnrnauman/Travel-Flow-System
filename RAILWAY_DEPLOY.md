# Deploying to Railway (Recommended)

Railway is the best platform for this stack (Node.js + Express + PostgreSQL).

## Why Railway (not Vercel)?

This system has an Express.js backend — a long-running server process that handles file uploads, Stripe webhooks, and database connections. Vercel only supports serverless functions and **cannot** run Express.js continuously.

For Vercel specifically: you can deploy the React frontend to Vercel and point it to a Railway backend, but Railway alone handles everything more simply.

---

## Option 1: Railway (Full Stack — Recommended)

### Step 1: Push your code to GitHub
Your repo is already at: `https://github.com/mnrnauman/Travel-Flow-System`

### Step 2: Create Railway account
Go to [railway.app](https://railway.app) and sign up (free tier available).

### Step 3: Create a new project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Connect your GitHub account and select `mnrnauman/Travel-Flow-System`

### Step 4: Add PostgreSQL
1. In your Railway project, click **"+ New Service"**
2. Select **"Database" → "PostgreSQL"**
3. Railway creates the DB and provides `DATABASE_URL` automatically

### Step 5: Set environment variables
In your Railway service settings → Variables, add:
```
NODE_ENV=production
JWT_SECRET=your-super-secret-key-minimum-32-chars
API_PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}   (auto-linked from Railway DB)
```

Optional (if using Stripe):
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Step 6: Configure build command
In Railway service settings:
- **Build Command**: `npm install && npx prisma generate && npx prisma db push`
- **Start Command**: `node server/index.js`

### Step 7: Deploy
Railway auto-deploys on every GitHub push. Your backend gets a URL like:
`https://your-app.railway.app`

### Step 8: Configure Frontend
Update Vite to point to the Railway backend URL in production. In your Railway project, add a **second service** for the frontend:
- **Build Command**: `npm run build`
- **Start Command**: `npx serve dist -p $PORT`

Or use Vercel for just the frontend (see Option 2).

---

## Option 2: Frontend on Vercel + Backend on Railway

### Backend → Railway
Follow steps 1–7 above. Note the backend URL (e.g., `https://backend.railway.app`).

### Frontend → Vercel
1. Go to [vercel.com](https://vercel.com) and connect your GitHub repo
2. Set **Framework Preset**: Vite
3. Add environment variable:
   ```
   VITE_API_URL=https://backend.railway.app
   ```
4. Update `src/lib/api.ts` to use `import.meta.env.VITE_API_URL` as the base URL
5. Deploy

---

## Super Admin Setup (after deployment)

After first deploy, run the seed script to create your super admin:
```bash
railway run node server/seedSuperAdmin.js
```

Or set these env vars before first deploy and the seed auto-runs:
```
SUPER_ADMIN_EMAIL=your@email.com
SUPER_ADMIN_PASSWORD=YourSecurePassword!
```

Default credentials (if not changed):
- Email: `superadmin@travelcrm.com`
- Password: `SuperAdmin@2025!`

**Change these immediately after first login.**

---

## Per-Agency Login URLs in Production

Once deployed, each agency's login URL will be:
```
https://your-railway-app.railway.app/goodluck-crm
https://your-railway-app.railway.app/grace-crm
https://your-railway-app.railway.app/flyclick-crm
```

You create agencies from the Super Admin panel at the root URL:
```
https://your-railway-app.railway.app/
```

---

## Custom Domain (optional)
Railway lets you add a custom domain in service settings.
With a custom domain like `app.travelcrm.com`:
- Super admin: `app.travelcrm.com/`
- GoodLuck: `app.travelcrm.com/goodluck-crm`
- GraceCRM: `app.travelcrm.com/grace-crm`
