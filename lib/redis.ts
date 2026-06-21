import Redis from 'ioredis'

const g = globalThis as typeof globalThis & { redis?: Redis }

if (!g.redis && process.env.REDIS_URL) {
  g.redis = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  })
  g.redis.on('error', () => { /* Redis unavailable — cache skipped */ })
}

const redis = g.redis ?? null

export const TTL = {
  RECIPES_LIST:   60,              // 1 min
  RECIPE_DETAIL:  120,             // 2 min
  USER_SESSION:   60 * 60 * 24 * 7, // 7 days
}

export const keys = {
  recipeList:  (qs: string)   => `recipes:list:${qs}`,
  recipeDetail:(id: string)   => `recipes:detail:${id}`,
  userSession: (userId: string) => `session:${userId}`,
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null
  try {
    const val = await redis.get(key)
    return val ? (JSON.parse(val) as T) : null
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttl: number): Promise<void> {
  if (!redis) return
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl)
  } catch { /* skip */ }
}

export async function cacheInvalidate(...patterns: string[]): Promise<void> {
  if (!redis) return
  try {
    for (const pattern of patterns) {
      if (pattern.includes('*')) {
        const matched = await redis.keys(pattern)
        if (matched.length) await redis.del(...matched)
      } else {
        await redis.del(pattern)
      }
    }
  } catch { /* skip */ }
}
