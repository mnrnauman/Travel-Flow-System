# GCIT Travel Agency CRM System — Deployment Guide

## Overview
GCIT Travel Agency CRM is a Node.js + React application that requires:
- **Node.js** 18+ 
- **PostgreSQL** 14+
- **A reverse proxy** (Nginx recommended)
- **PM2** for process management

---

## Part 1 — Debian / Ubuntu Linux Server

### Step 1: System Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v   # should show v20.x.x
npm -v

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

### Step 2: PostgreSQL Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Inside psql — create user and database
CREATE USER travelflow WITH PASSWORD 'CHOOSE_STRONG_PASSWORD';
CREATE DATABASE travelflow_db OWNER travelflow;
GRANT ALL PRIVILEGES ON DATABASE travelflow_db TO travelflow;
\q
```

### Step 3: Deploy Application

```bash
# Create app directory
sudo mkdir -p /var/www/travelflow
sudo chown $USER:$USER /var/www/travelflow
cd /var/www/travelflow

# Clone or upload your files
git clone https://github.com/YOUR_USERNAME/travelflow-crm.git .
# OR use scp/rsync to upload files

# Install dependencies
npm install

# Create environment file
cp .env.example .env
nano .env
```

### Step 4: Environment Configuration

Edit `/var/www/travelflow/.env`:
```env
# Database
DATABASE_URL="postgresql://travelflow:CHOOSE_STRONG_PASSWORD@localhost:5432/travelflow_db"

# JWT Secret (generate a random 64-char string)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"

# Server
NODE_ENV=production
API_PORT=3001
FRONTEND_URL=https://yourdomain.com

# Stripe (optional — for online payments)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Email (for automation templates)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your@email.com
# SMTP_PASS=your-app-password
```

### Step 5: Database Migration & Build

```bash
cd /var/www/travelflow

# Run Prisma migration to create tables
npx prisma db push

# Build frontend for production
npm run build

# The built files will be in /var/www/travelflow/dist/
```

### Step 6: PM2 Process Manager

```bash
# Create PM2 config file
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: 'travelflow-api',
      script: 'server/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
EOF

# Start the API server
pm2 start ecosystem.config.cjs

# Save PM2 config to survive reboots
pm2 save

# Set PM2 to start on system boot
pm2 startup
# Run the command that pm2 outputs (it'll look like: sudo env PATH=... pm2 startup ...)

# Check status
pm2 status
pm2 logs travelflow-api
```

### Step 7: Nginx Configuration

```bash
# Create Nginx site config
sudo nano /etc/nginx/sites-available/travelflow
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (React build)
    root /var/www/travelflow/dist;
    index index.html;

    # Serve React app (SPA routing)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Stripe webhook (raw body required)
    location /api/webhooks/stripe {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/travelflow /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 8: SSL with Let's Encrypt (HTTPS)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will auto-update your Nginx config and set up auto-renewal
# Verify auto-renewal works:
sudo certbot renew --dry-run
```

### Step 9: Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## Part 2 — Windows Server (IIS or PM2)

### Prerequisites
1. Install **Node.js 20 LTS** from https://nodejs.org
2. Install **PostgreSQL 16** from https://www.postgresql.org/download/windows/
3. Install **Git** from https://git-scm.com

### Step 1: PostgreSQL Setup

Open pgAdmin or run as Administrator in PowerShell:
```sql
CREATE USER travelflow WITH PASSWORD 'STRONG_PASSWORD';
CREATE DATABASE travelflow_db OWNER travelflow;
GRANT ALL PRIVILEGES ON DATABASE travelflow_db TO travelflow;
```

### Step 2: Deploy Files

```powershell
# Create app folder
mkdir C:\apps\travelflow
cd C:\apps\travelflow

# Clone or copy files here
# Then install dependencies:
npm install

# Create .env file (copy from .env.example and edit)
copy .env.example .env
notepad .env
```

### Step 3: Environment (.env)

Same as the Linux guide above — set `DATABASE_URL`, `JWT_SECRET`, etc.
Use Windows path separators if needed, but the env vars themselves are the same.

### Step 4: Database & Build

```powershell
cd C:\apps\travelflow
npx prisma db push
npm run build
```

### Step 5: PM2 on Windows

```powershell
# Install PM2 globally
npm install -g pm2
npm install -g pm2-windows-startup

# Start the app
pm2 start server/index.js --name travelflow-api

# Save and set startup
pm2 save
pm2-startup install

# Check status
pm2 status
```

### Step 6: Windows IIS Reverse Proxy

Install **URL Rewrite** and **Application Request Routing** (ARR) for IIS.

In IIS Manager:
1. Create a new site pointing to `C:\apps\travelflow\dist`
2. Add a URL Rewrite rule: 
   - Pattern: `^api/(.*)`
   - Rewrite URL: `http://localhost:3001/api/{R:1}`
3. Add another rule for SPA: rewrite all non-file requests to `/index.html`

**Alternative: Use Nginx for Windows** (easier)
Download nginx from https://nginx.org/en/download.html and use the same config as Linux above.

---

## Stripe Setup (Optional)

### Get Stripe Keys
1. Go to https://dashboard.stripe.com
2. Navigate to Developers → API Keys
3. Copy `Secret key` (starts with `sk_live_...`)
4. Add to your `.env`: `STRIPE_SECRET_KEY=sk_live_...`

### Set Up Webhook
1. Go to Developers → Webhooks → Add endpoint
2. URL: `https://yourdomain.com/api/webhooks/stripe`
3. Events to listen: `checkout.session.completed`
4. Copy the Signing secret (starts with `whsec_...`)
5. Add to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`

---

## Updating the Application

```bash
cd /var/www/travelflow

# Pull latest code
git pull

# Install any new dependencies
npm install

# Apply any database changes
npx prisma db push

# Rebuild frontend
npm run build

# Restart backend
pm2 restart travelflow-api

# Nginx doesn't need restart (serves static files directly)
```

---

## Multi-Agency SaaS Setup

Each agency that registers via **Register Agency** on the login page gets their own isolated workspace. All data is scoped by `agencyId`. 

For a public SaaS deployment:
1. Deploy to a VPS (DigitalOcean, Hetzner, Vultr — $6-20/mo)
2. Point your domain to the server
3. Enable SSL with Let's Encrypt (free)
4. Agencies self-register at `https://yourdomain.com`

---

## Default Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | demo123 |
| Agent | sarah@demo.com | demo123 |
| Agent | mike@demo.com | demo123 |

---

## Backup Database

```bash
# Backup
pg_dump -U travelflow travelflow_db > backup_$(date +%Y%m%d).sql

# Restore
psql -U travelflow travelflow_db < backup_20260411.sql
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | Check `pm2 logs travelflow-api` for errors |
| Database connection fails | Verify DATABASE_URL in .env, PostgreSQL is running |
| Can't login | Ensure backend is running (`pm2 status`), check JWT_SECRET is set |
| Stripe payments fail | Verify STRIPE_SECRET_KEY is correct, check for test vs live mode |
| Frontend shows blank page | Check browser console, ensure `npm run build` was run |
| Nginx 502 error | Backend not running, check `pm2 status` |
