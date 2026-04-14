# Travel Agency CRM — Self-Hosting Guide

Complete guide to deploy this application on your own server or VPS (Ubuntu/Debian recommended).

---

## Requirements

| Requirement | Version |
|---|---|
| Node.js | >= 22.0.0 |
| npm | >= 10 |
| PostgreSQL | >= 14 |
| OS | Ubuntu 22.04 / Debian 12 (or any Linux) |
| RAM | Minimum 1 GB (2 GB recommended) |

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/mnrnauman/Travel-Flow-System.git
cd Travel-Flow-System
npm install
```

---

## Step 2 — Set Up PostgreSQL

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create a database and user
sudo -u postgres psql <<EOF
CREATE USER crmuser WITH PASSWORD 'YourStrongPassword123!';
CREATE DATABASE travelcrm OWNER crmuser;
GRANT ALL PRIVILEGES ON DATABASE travelcrm TO crmuser;
EOF
```

---

## Step 3 — Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env  # or create it manually
nano .env
```

Fill in the following:

```env
# ─── DATABASE ────────────────────────────────────────────────
DATABASE_URL=postgresql://crmuser:YourStrongPassword123!@localhost:5432/travelcrm

# ─── APP SETTINGS ────────────────────────────────────────────
NODE_ENV=production
PORT=5000

# ─── JWT SECRET (generate a strong random string) ────────────
# Run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_super_long_random_secret_here_at_least_64_characters

# ─── SUPER ADMIN (first-time login) ──────────────────────────
SUPER_ADMIN_EMAIL=superadmin@yourdomain.com
SUPER_ADMIN_PASSWORD=YourSecureAdminPassword!

# ─── STRIPE (optional — for online payments) ─────────────────
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxx

# ─── EMAIL / SMTP (optional — for notifications) ─────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your@gmail.com

# ─── FILE UPLOADS ─────────────────────────────────────────────
# Leave empty to use local disk storage
UPLOAD_DIR=uploads
```

---

## Step 4 — Initialize the Database Schema

```bash
# Generate the Prisma client
npx prisma generate

# Push the schema to your database (creates all tables)
npx prisma db push
```

---

## Step 5 — Build the Frontend

```bash
npm run build
```

This compiles TypeScript and bundles React into the `dist/` folder.

---

## Step 6 — Seed the Super Admin (first run only)

The super admin is automatically created on first boot when `NODE_ENV=production`. It uses the `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` values from your `.env` file.

If you want to seed manually:

```bash
node -e "
import('dotenv/config').then(async () => {
  const bcrypt = (await import('bcryptjs')).default;
  const { PrismaClient } = await import('@prisma/client');
  const { PrismaPg } = await import('@prisma/adapter-pg');
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  const hashed = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD, 12);
  const r = await prisma.superAdmin.upsert({
    where: { email: process.env.SUPER_ADMIN_EMAIL },
    update: {},
    create: { email: process.env.SUPER_ADMIN_EMAIL, password: hashed, name: 'Platform Admin' }
  });
  console.log('Super admin ready:', r.email);
  await prisma.\$disconnect();
});
"
```

---

## Step 7 — Run the Application

### Option A — Simple (test/try it out)

```bash
SERVE_FRONTEND=true node server/index.js
```

The app will be available at `http://your-server-ip:5000`

---

### Option B — Production with PM2 (recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the app
SERVE_FRONTEND=true pm2 start server/index.js --name "travel-crm"

# Save PM2 process list (auto-restart on reboot)
pm2 save
pm2 startup  # follow the command it prints

# View logs
pm2 logs travel-crm

# Restart after code updates
pm2 restart travel-crm
```

---

### Option C — systemd Service (alternative to PM2)

Create `/etc/systemd/system/travel-crm.service`:

```ini
[Unit]
Description=Travel Agency CRM
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/Travel-Flow-System
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=SERVE_FRONTEND=true
EnvironmentFile=/home/ubuntu/Travel-Flow-System/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable travel-crm
sudo systemctl start travel-crm
sudo systemctl status travel-crm
```

---

## Step 8 — Set Up Nginx as Reverse Proxy (recommended)

```bash
sudo apt install nginx -y
```

Create `/etc/nginx/sites-available/travel-crm`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/travel-crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 9 — SSL / HTTPS with Let's Encrypt (recommended)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot automatically renews your certificate. Your app will be available at `https://yourdomain.com`.

---

## Updating the Application

```bash
cd Travel-Flow-System
git pull origin main
npm install
npm run build
npx prisma db push    # only if schema changed
pm2 restart travel-crm
```

---

## Firewall Configuration

```bash
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw enable
```

---

## Credentials Summary

| Item | Value | Notes |
|---|---|---|
| Super Admin Login | Set via `SUPER_ADMIN_EMAIL` | Login at `/super-admin/login` |
| Super Admin Password | Set via `SUPER_ADMIN_PASSWORD` | Change after first login |
| Database | `travelcrm` on localhost | PostgreSQL |
| DB User | `crmuser` | Use a strong password |
| App Port | `5000` | Proxied by Nginx |
| JWT Secret | Random 64-char string | Keep secret, never commit |

---

## Troubleshooting

| Problem | Solution |
|---|---|
| App won't start | Check `pm2 logs` or `journalctl -u travel-crm` |
| DB connection error | Verify `DATABASE_URL` in `.env` and PostgreSQL is running |
| 502 Bad Gateway | App crashed — check logs; restart with `pm2 restart travel-crm` |
| Can't login | Check super admin was seeded; verify `JWT_SECRET` is set |
| Uploads not working | Create the `uploads/` directory: `mkdir -p uploads` |
| Schema out of date | Run `npx prisma db push` after git pull |

---

## Stripe Setup (optional)

1. Create an account at [stripe.com](https://stripe.com)
2. Get your **Secret Key** from Stripe Dashboard → Developers → API keys
3. Set up a webhook pointing to `https://yourdomain.com/api/webhooks/stripe`
4. Get the **Webhook Secret** from the webhook details page
5. Add both to your `.env` file

---

## Email Setup (optional)

For Gmail, enable "App Passwords":
1. Google Account → Security → 2-Step Verification → App Passwords
2. Generate a password for "Mail"
3. Use that password as `SMTP_PASS` in your `.env`

For other providers (SendGrid, Mailgun, etc.), update `SMTP_*` values accordingly.
