import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { prisma } from '@/lib/db'
import { profileKey, recipeMediaKey, uploadFile, deleteFile, keyFromUrl } from '@/lib/s3'

const app = new Hono().basePath('/api')

const slugify = (s: string) =>
  s.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9-]/g, '')

const userSelect = { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true } as const

type WithRatingsCount = { ratings: { score: number }[]; _count: { comments: number } }
const enrich = (r: WithRatingsCount) => ({
  avgRating: r.ratings.length ? r.ratings.reduce((s, rt: { score: number }) => s + rt.score, 0) / r.ratings.length : 0,
  ratingCount: r.ratings.length,
  commentCount: r._count.comments,
})

// ─── AUTH ─────────────────────────────────────────────────────────────────────

app.get('/auth/me', async (c) => {
  const userId = getCookie(c, 'session')
  if (!userId) return c.json(null)
  const user = await prisma.user.findUnique({ where: { id: userId }, select: userSelect })
  return c.json(user)
})

app.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>()
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || user.password !== password) return c.json({ error: 'Credenciales incorrectas' }, 401)
  setCookie(c, 'session', user.id, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'Lax' })
  const { password: _pw, ...safe } = user
  return c.json(safe)
})

app.post('/auth/logout', (c) => {
  deleteCookie(c, 'session', { path: '/' })
  return c.json({ ok: true })
})

// ─── RECIPES ─────────────────────────────────────────────────────────────────

const recipeListInclude = {
  author: { select: userSelect },
  category: true,
  subcategory: true,
  ratings: { select: { score: true } },
  _count: { select: { comments: true } },
} as const

app.get('/recipes', async (c) => {
  const { categoryId, subcategoryId, search } = c.req.query()
  const recipes = await prisma.recipe.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(subcategoryId ? { subcategoryId } : {}),
      ...(search
        ? { OR: [{ title: { contains: search } }, { description: { contains: search } }] }
        : {}),
    },
    include: recipeListInclude,
    orderBy: { createdAt: 'desc' },
  })
  return c.json(recipes.map(r => ({ ...r, ...enrich(r) })))
})

app.post('/recipes', async (c) => {
  const body = await c.req.json()
  const recipe = await prisma.recipe.create({
    data: {
      title: body.title,
      description: body.description,
      instructions: body.instructions,
      imageUrl: body.imageUrl || null,
      categoryId: body.categoryId,
      subcategoryId: body.subcategoryId || null,
      authorId: body.authorId,
      ingredients: {
        createMany: {
          data: (body.ingredients ?? []).map(
            ({ ingredientId, quantity }: { ingredientId: string; quantity: number }) => ({ ingredientId, quantity })
          ),
        },
      },
    },
  })
  return c.json(recipe, 201)
})

app.get('/recipes/:id', async (c) => {
  const id = c.req.param('id')
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      author: { select: userSelect },
      category: true,
      subcategory: true,
      ingredients: { include: { ingredient: true } },
      comments: {
        include: { user: { select: userSelect } },
        orderBy: { createdAt: 'asc' },
      },
      ratings: true,
    },
  })
  if (!recipe) return c.json({ error: 'Not found' }, 404)
  return c.json({
    ...recipe,
    avgRating: recipe.ratings.length ? recipe.ratings.reduce((s, rt) => s + rt.score, 0) / recipe.ratings.length : 0,
    ratingCount: recipe.ratings.length,
    commentCount: recipe.comments.length,
  })
})

app.put('/recipes/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const recipe = await prisma.$transaction(async (tx) => {
    await tx.recipeIngredient.deleteMany({ where: { recipeId: id } })
    return tx.recipe.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        instructions: body.instructions,
        imageUrl: body.imageUrl || null,
        categoryId: body.categoryId,
        subcategoryId: body.subcategoryId || null,
        authorId: body.authorId,
        ingredients: {
          createMany: {
            data: (body.ingredients ?? []).map(
              ({ ingredientId, quantity }: { ingredientId: string; quantity: number }) => ({ ingredientId, quantity })
            ),
          },
        },
      },
    })
  })
  return c.json(recipe)
})

app.delete('/recipes/:id', async (c) => {
  await prisma.recipe.delete({ where: { id: c.req.param('id') } })
  return c.json({ ok: true })
})

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

app.get('/categories', async (c) => {
  return c.json(await prisma.category.findMany({ orderBy: { name: 'asc' } }))
})

app.post('/categories', async (c) => {
  const { name } = await c.req.json()
  return c.json(await prisma.category.create({ data: { name, slug: slugify(name) } }), 201)
})

app.put('/categories/:id', async (c) => {
  const { name } = await c.req.json()
  return c.json(
    await prisma.category.update({ where: { id: c.req.param('id') }, data: { name, slug: slugify(name) } })
  )
})

app.delete('/categories/:id', async (c) => {
  await prisma.category.delete({ where: { id: c.req.param('id') } })
  return c.json({ ok: true })
})

// ─── SUBCATEGORIES ────────────────────────────────────────────────────────────

app.get('/subcategories', async (c) => {
  const { categoryId } = c.req.query()
  return c.json(
    await prisma.subcategory.findMany({
      where: categoryId ? { categoryId } : undefined,
      orderBy: { name: 'asc' },
    })
  )
})

app.post('/subcategories', async (c) => {
  const { name, categoryId } = await c.req.json()
  return c.json(await prisma.subcategory.create({ data: { name, slug: slugify(name), categoryId } }), 201)
})

app.put('/subcategories/:id', async (c) => {
  const { name, categoryId } = await c.req.json()
  return c.json(
    await prisma.subcategory.update({
      where: { id: c.req.param('id') },
      data: { name, slug: slugify(name), categoryId },
    })
  )
})

app.delete('/subcategories/:id', async (c) => {
  await prisma.subcategory.delete({ where: { id: c.req.param('id') } })
  return c.json({ ok: true })
})

// ─── INGREDIENTS ──────────────────────────────────────────────────────────────

app.get('/ingredients', async (c) => {
  return c.json(await prisma.ingredient.findMany({ orderBy: { name: 'asc' } }))
})

app.post('/ingredients', async (c) => {
  const { name, unit } = await c.req.json()
  return c.json(await prisma.ingredient.create({ data: { name, unit } }), 201)
})

app.put('/ingredients/:id', async (c) => {
  const { name, unit } = await c.req.json()
  return c.json(await prisma.ingredient.update({ where: { id: c.req.param('id') }, data: { name, unit } }))
})

app.delete('/ingredients/:id', async (c) => {
  await prisma.ingredient.delete({ where: { id: c.req.param('id') } })
  return c.json({ ok: true })
})

// ─── USERS ────────────────────────────────────────────────────────────────────

app.get('/users', async (c) => {
  return c.json(await prisma.user.findMany({ select: userSelect, orderBy: { createdAt: 'asc' } }))
})

app.post('/users', async (c) => {
  const { name, email, password = 'password123', role = 'user' } = await c.req.json()
  const user = await prisma.user.create({ data: { name, email, password, role } })
  const { password: _pw, ...safe } = user
  return c.json(safe, 201)
})

app.put('/users/:id', async (c) => {
  const { name, email, password, role } = await c.req.json()
  const data: Record<string, unknown> = { name, email, role }
  if (password) data.password = password
  const user = await prisma.user.update({ where: { id: c.req.param('id') }, data })
  const { password: _pw, ...safe } = user
  return c.json(safe)
})

app.delete('/users/:id', async (c) => {
  await prisma.user.delete({ where: { id: c.req.param('id') } })
  return c.json({ ok: true })
})

// ─── COMMENTS ────────────────────────────────────────────────────────────────

app.post('/recipes/:id/comments', async (c) => {
  const { userId, content } = await c.req.json()
  const comment = await prisma.comment.create({
    data: { recipeId: c.req.param('id'), userId, content },
    include: { user: { select: userSelect } },
  })
  return c.json(comment, 201)
})

app.delete('/comments/:id', async (c) => {
  await prisma.comment.delete({ where: { id: c.req.param('id') } })
  return c.json({ ok: true })
})

// ─── RATINGS ─────────────────────────────────────────────────────────────────

app.post('/recipes/:id/ratings', async (c) => {
  const recipeId = c.req.param('id')
  const { userId, score } = await c.req.json()
  const rating = await prisma.rating.upsert({
    where: { recipeId_userId: { recipeId, userId } },
    update: { score },
    create: { recipeId, userId, score },
  })
  return c.json(rating)
})

app.get('/recipes/:id/ratings/:userId', async (c) => {
  const { id: recipeId, userId } = c.req.param()
  const rating = await prisma.rating.findUnique({ where: { recipeId_userId: { recipeId, userId } } })
  return c.json(rating)
})

// ─── UPLOADS ─────────────────────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

function fileExt(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? 'bin'
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

app.post('/upload/profile/:userId', async (c) => {
  const userId = c.req.param('userId')
  const formData = await c.req.formData()
  const file = formData.get('file') as File | null
  if (!file) return c.json({ error: 'No se recibió ningún archivo' }, 400)
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return c.json({ error: 'Tipo de archivo no permitido' }, 400)
  if (file.size > MAX_FILE_SIZE) return c.json({ error: 'El archivo supera el límite de 10 MB' }, 400)

  const buffer = Buffer.from(await file.arrayBuffer())
  const key = profileKey(userId, fileExt(file.name))
  const url = await uploadFile(key, buffer, file.type)

  await prisma.user.update({ where: { id: userId }, data: { avatarUrl: url } })
  return c.json({ url })
})

app.delete('/upload/profile/:userId', async (c) => {
  const userId = c.req.param('userId')
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } })
  if (user?.avatarUrl) {
    const key = keyFromUrl(user.avatarUrl)
    if (key) await deleteFile(key)
  }
  await prisma.user.update({ where: { id: userId }, data: { avatarUrl: null } })
  return c.json({ ok: true })
})

app.post('/upload/recipe/:recipeId', async (c) => {
  const recipeId = c.req.param('recipeId')
  const formData = await c.req.formData()
  const file = formData.get('file') as File | null
  if (!file) return c.json({ error: 'No se recibió ningún archivo' }, 400)
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return c.json({ error: 'Tipo de archivo no permitido' }, 400)
  if (file.size > MAX_FILE_SIZE) return c.json({ error: 'El archivo supera el límite de 10 MB' }, 400)

  const buffer = Buffer.from(await file.arrayBuffer())
  const key = recipeMediaKey(recipeId, sanitizeFilename(file.name))
  const url = await uploadFile(key, buffer, file.type)

  await prisma.recipe.update({ where: { id: recipeId }, data: { imageUrl: url } })
  return c.json({ url })
})

app.delete('/upload/recipe/:recipeId', async (c) => {
  const recipeId = c.req.param('recipeId')
  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId }, select: { imageUrl: true } })
  if (recipe?.imageUrl) {
    const key = keyFromUrl(recipe.imageUrl)
    if (key) await deleteFile(key)
  }
  await prisma.recipe.update({ where: { id: recipeId }, data: { imageUrl: null } })
  return c.json({ ok: true })
})

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
