import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import type { RecipeDetail } from '@/lib/types'
import RecipeInteractions from './RecipeInteractions'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

async function fetchRecipe(id: string) {
  return prisma.recipe.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true } },
      category: true,
      subcategory: true,
      ingredients: { include: { ingredient: true } },
      comments: {
        include: { user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true } } },
        orderBy: { createdAt: 'asc' },
      },
      ratings: { select: { id: true, recipeId: true, userId: true, score: true } },
    },
  })
}

function serialize(recipe: NonNullable<Awaited<ReturnType<typeof fetchRecipe>>>): RecipeDetail {
  const avgRating = recipe.ratings.length
    ? recipe.ratings.reduce((s, r) => s + r.score, 0) / recipe.ratings.length
    : 0

  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    instructions: recipe.instructions,
    imageUrl: recipe.imageUrl ?? undefined,
    categoryId: recipe.categoryId,
    subcategoryId: recipe.subcategoryId ?? undefined,
    authorId: recipe.authorId,
    createdAt: recipe.createdAt.toISOString(),
    author: recipe.author
      ? { ...recipe.author, role: recipe.author.role as 'admin' | 'user', avatarUrl: recipe.author.avatarUrl ?? undefined, createdAt: recipe.author.createdAt.toISOString() }
      : undefined,
    category: recipe.category ?? undefined,
    subcategory: recipe.subcategory ?? undefined,
    avgRating,
    ratingCount: recipe.ratings.length,
    commentCount: recipe.comments.length,
    ratings: recipe.ratings,
    comments: recipe.comments.map(c => ({
      id: c.id,
      recipeId: c.recipeId,
      userId: c.userId,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      user: c.user
        ? { ...c.user, role: c.user.role as 'admin' | 'user', avatarUrl: c.user.avatarUrl ?? undefined, createdAt: c.user.createdAt.toISOString() }
        : undefined,
    })),
    ingredients: recipe.ingredients.map(ri => ({
      ingredientId: ri.ingredientId,
      quantity: ri.quantity,
      ingredient: ri.ingredient ?? undefined,
    })),
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const recipe = await fetchRecipe(id)
  if (!recipe) return {}
  return {
    title: recipe.title,
    description: recipe.description,
    openGraph: {
      title: recipe.title,
      description: recipe.description,
      type: 'article',
      images: recipe.imageUrl ? [{ url: recipe.imageUrl, alt: recipe.title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: recipe.title,
      description: recipe.description,
      images: recipe.imageUrl ? [recipe.imageUrl] : [],
    },
  }
}

export default async function RecipePage({ params }: Props) {
  const { id } = await params
  const recipe = await fetchRecipe(id)
  if (!recipe) notFound()

  const data = serialize(recipe)

  const avgRating = data.avgRating
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.description,
    image: recipe.imageUrl,
    datePublished: recipe.createdAt.toISOString(),
    author: { '@type': 'Person', name: recipe.author?.name },
    recipeCategory: recipe.category?.name,
    ...(recipe.ratings.length > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRating.toFixed(1),
        reviewCount: recipe.ratings.length,
      },
    }),
    recipeIngredient: recipe.ingredients.map(
      ri => `${ri.quantity} ${ri.ingredient?.unit ?? ''} de ${ri.ingredient?.name ?? ''}`.trim(),
    ),
    recipeInstructions: recipe.instructions
      .split('\n')
      .filter(Boolean)
      .map((step, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        text: step.replace(/^\d+\.\s*/, ''),
      })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RecipeInteractions initialRecipe={data} />
    </>
  )
}
