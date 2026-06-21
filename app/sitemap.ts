import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  const recipes = await prisma.recipe.findMany({
    select: { id: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/login`, changeFrequency: 'yearly', priority: 0.2 },
    ...recipes.map(r => ({
      url: `${base}/recipes/${r.id}`,
      lastModified: r.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
