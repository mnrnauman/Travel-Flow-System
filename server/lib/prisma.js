import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter })
}

const prisma = createPrismaClient()

// Wrap Prisma to retry on Neon cold-start / endpoint-disabled errors
const RETRYABLE = ['endpoint has been disabled', 'P1001', 'ECONNREFUSED', 'connect ETIMEDOUT', 'Can\'t reach database']

async function withRetry(fn, retries = 4, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      const msg = err?.message || ''
      const isRetryable = RETRYABLE.some(r => msg.toLowerCase().includes(r.toLowerCase()))
      if (isRetryable && i < retries - 1) {
        console.log(`DB connection retry ${i + 1}/${retries - 1} after ${delay}ms... (${msg.slice(0, 60)})`)
        await new Promise(r => setTimeout(r, delay))
        delay = Math.min(delay * 1.5, 8000)
      } else {
        throw err
      }
    }
  }
}

// Proxy that wraps every model operation with retry
const prismaProxy = new Proxy(prisma, {
  get(target, prop) {
    const value = target[prop]
    if (typeof value === 'object' && value !== null && !prop.startsWith('$')) {
      return new Proxy(value, {
        get(modelTarget, method) {
          const fn = modelTarget[method]
          if (typeof fn === 'function') {
            return (...args) => withRetry(() => fn.apply(modelTarget, args))
          }
          return fn
        }
      })
    }
    return value
  }
})

export default prismaProxy
