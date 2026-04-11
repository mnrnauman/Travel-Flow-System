import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@travelcrm.com'
  const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@2025!'
  const name = process.env.SUPER_ADMIN_NAME || 'Platform Admin'

  const existing = await prisma.superAdmin.findUnique({ where: { email } })
  if (existing) {
    console.log(`Super admin already exists: ${email}`)
    return
  }

  const hashed = await bcrypt.hash(password, 12)
  await prisma.superAdmin.create({ data: { email, password: hashed, name } })
  console.log(`\n✅ Super admin created!`)
  console.log(`   Email:    ${email}`)
  console.log(`   Password: ${password}`)
  console.log(`\n⚠️  Change the password after first login!\n`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
