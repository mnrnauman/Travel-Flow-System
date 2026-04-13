import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Allow overriding the frozen Replit production DB with a custom URL
const connectionString = process.env.APP_DATABASE_URL || process.env.DATABASE_URL

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter })
}

const prisma = createPrismaClient()

// Retry wrapper for Neon cold starts
const RETRYABLE = ['endpoint has been disabled', 'P1001', 'ECONNREFUSED', 'connect ETIMEDOUT', "Can't reach database"]

async function withRetry(fn, retries = 4, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      const msg = err?.message || ''
      const isRetryable = RETRYABLE.some(r => msg.toLowerCase().includes(r.toLowerCase()))
      if (isRetryable && i < retries - 1) {
        console.log(`DB retry ${i + 1}/${retries - 1} in ${delay}ms...`)
        await new Promise(r => setTimeout(r, delay))
        delay = Math.min(delay * 1.5, 8000)
      } else {
        throw err
      }
    }
  }
}

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
