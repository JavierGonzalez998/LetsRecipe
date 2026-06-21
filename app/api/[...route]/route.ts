import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { Context, Next } from 'hono'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { signToken, verifyToken, COOKIE, type JWTPayload } from '@/lib/jwt'
import { profileKey, recipeMediaKey, uploadFile, deleteFile, keyFromUrl } from '@/lib/s3'
import { cacheGet, cacheSet, cacheInvalidate, keys, TTL } from '@/lib/redis'

type Variables = { jwt: JWTPayload }
const app = new Hono<{ Variables: Variables }>().basePath('/api')

const slugify = (s: string) =>
  s.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9-]/g, '')

const userSelect = { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true } as const

type WithRatingsCount = { ratings: { score: number }[]; _count: { comments: number } }
const enrich = (r: WithRatingsCount) => ({
  avgRating: r.ratings.length ? r.ratings.reduce((s, rt) => s + rt.score, 0) / r.ratings.length : 0,
  ratingCount: r.ratings.length,
  commentCount: r._count.comments,
})

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────

const requireAuth = async (c: Context<{ Variables: Variables }>, next: Next) => {
  const token = getCookie(c, COOKIE)
  if (!token) return c.json({ error: 'No autenticado' }, 401)
  const payload = await verifyToken(token)
  if (!payload) return c.json({ error: 'Sesión inválida o expirada' }, 401)
  c.set('jwt', payload)
  await next()
}

const requireAdmin = async (c: Context<{ Variables: Variables }>, next: Next) => {
  const token = getCookie(c, COOKIE)
  if (!token) return c.json({ error: 'No autenticado' }, 401)
  const payload = await verifyToken(token)
  if (!payload) return c.json({ error: 'Sesión inválida o expirada' }, 401)
  if (payload.role !== 'admin') return c.json({ error: 'Acceso denegado' }, 403)
  c.set('jwt', payload)
  await next()
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

app.get('/auth/me', async (c) => {
  const token = getCookie(c, COOKIE)
  if (!token) return c.json(null)
  const payload = await verifyToken(token)
  if (!payload) return c.json(null)

  const cached = await cacheGet(keys.userSession(payload.sub))
  if (cached) return c.json(cached)

  const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: userSelect })
  if (!user) return c.json(null)

  await cacheSet(keys.userSession(payload.sub), user, TTL.USER_SESSION)
  return c.json(user)
})

app.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>()
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return c.json({ error: 'Credenciales incorrectas' }, 401)

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return c.json({ error: 'Credenciales incorrectas' }, 401)

  const token = await signToken({
    sub: user.id,
    role: user.role as 'admin' | 'user',
    name: user.name,
    email: user.email,
  })

  setCookie(c, COOKIE, token, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
  })

  const { password: _pw, ...safe } = user
  return c.json(safe)
})

app.post('/auth/logout', requireAuth, async (c) => {
  await cacheInvalidate(keys.userSession(c.get('jwt').sub))
  deleteCookie(c, COOKIE, { path: '/' })
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
  const qs = new URLSearchParams(c.req.query()).toString()
  const cacheKey = keys.recipeList(qs)

  const cached = await cacheGet(cacheKey)
  if (cached) return c.json(cached)

  const { categoryId, subcategoryId, search } = c.req.query()
  const recipes = await prisma.recipe.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(subcategoryId ? { subcategoryId } : {}),
      ...(search ? { OR: [{ title: { contains: search } }, { description: { contains: search } }] } : {}),
    },
    include: recipeListInclude,
    orderBy: { createdAt: 'desc' },
  })
  const result = recipes.map(r => ({ ...r, ...enrich(r) }))
  await cacheSet(cacheKey, result, TTL.RECIPES_LIST)
  return c.json(result)
})

app.post('/recipes', requireAdmin, async (c) => {
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
            ({ ingredientId, quantity }: { ingredientId: string; quantity: number }) => ({ ingredientId, quantity }),
          ),
        },
      },
    },
  })
  await cacheInvalidate('recipes:list:*')
  return c.json(recipe, 201)
})

app.get('/recipes/:id', async (c) => {
  const id = c.req.param('id') as string
  const cacheKey = keys.recipeDetail(id)

  const cached = await cacheGet(cacheKey)
  if (cached) return c.json(cached)

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      author: { select: userSelect },
      category: true,
      subcategory: true,
      ingredients: { include: { ingredient: true } },
      comments: { include: { user: { select: userSelect } }, orderBy: { createdAt: 'asc' } },
      ratings: true,
    },
  })
  if (!recipe) return c.json({ error: 'Not found' }, 404)

  const result = {
    ...recipe,
    avgRating: recipe.ratings.length ? recipe.ratings.reduce((s, rt) => s + rt.score, 0) / recipe.ratings.length : 0,
    ratingCount: recipe.ratings.length,
    commentCount: recipe.comments.length,
  }
  await cacheSet(cacheKey, result, TTL.RECIPE_DETAIL)
  return c.json(result)
})

app.put('/recipes/:id', requireAdmin, async (c) => {
  const id = c.req.param('id') as string
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
              ({ ingredientId, quantity }: { ingredientId: string; quantity: number }) => ({ ingredientId, quantity }),
            ),
          },
        },
      },
    })
  })
  await cacheInvalidate('recipes:list:*', keys.recipeDetail(id))
  return c.json(recipe)
})

app.delete('/recipes/:id', requireAdmin, async (c) => {
  const id = c.req.param('id') as string
  await prisma.recipe.delete({ where: { id } })
  await cacheInvalidate('recipes:list:*', keys.recipeDetail(id))
  return c.json({ ok: true })
})

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

app.get('/categories', async (c) => {
  return c.json(await prisma.category.findMany({ orderBy: { name: 'asc' } }))
})

app.post('/categories', requireAdmin, async (c) => {
  const { name } = await c.req.json()
  return c.json(await prisma.category.create({ data: { name, slug: slugify(name) } }), 201)
})

app.put('/categories/:id', requireAdmin, async (c) => {
  const id = c.req.param('id') as string
  const { name } = await c.req.json()
  return c.json(await prisma.category.update({ where: { id }, data: { name, slug: slugify(name) } }))
})

app.delete('/categories/:id', requireAdmin, async (c) => {
  const id = c.req.param('id') as string
  await prisma.category.delete({ where: { id } })
  return c.json({ ok: true })
})

// ─── SUBCATEGORIES ────────────────────────────────────────────────────────────

app.get('/subcategories', async (c) => {
  const { categoryId } = c.req.query()
  return c.json(
    await prisma.subcategory.findMany({
      where: categoryId ? { categoryId } : undefined,
      orderBy: { name: 'asc' },
    }),
  )
})

app.post('/subcategories', requireAdmin, async (c) => {
  const { name, categoryId } = await c.req.json()
  return c.json(await prisma.subcategory.create({ data: { name, slug: slugify(name), categoryId } }), 201)
})

app.put('/subcategories/:id', requireAdmin, async (c) => {
  const id = c.req.param('id') as string
  const { name, categoryId } = await c.req.json()
  return c.json(await prisma.subcategory.update({ where: { id }, data: { name, slug: slugify(name), categoryId } }))
})

app.delete('/subcategories/:id', requireAdmin, async (c) => {
  const id = c.req.param('id') as string
  await prisma.subcategory.delete({ where: { id } })
  return c.json({ ok: true })
})

// ─── INGREDIENTS ──────────────────────────────────────────────────────────────

app.get('/ingredients', async (c) => {
  return c.json(await prisma.ingredient.findMany({ orderBy: { name: 'asc' } }))
})

app.post('/ingredients', requireAdmin, async (c) => {
  const { name, unit } = await c.req.json()
  return c.json(await prisma.ingredient.create({ data: { name, unit } }), 201)
})

app.put('/ingredients/:id', requireAdmin, async (c) => {
  const id = c.req.param('id') as string
  const { name, unit } = await c.req.json()
  return c.json(await prisma.ingredient.update({ where: { id }, data: { name, unit } }))
})

app.delete('/ingredients/:id', requireAdmin, async (c) => {
  const id = c.req.param('id') as string
  await prisma.ingredient.delete({ where: { id } })
  return c.json({ ok: true })
})

// ─── USERS ────────────────────────────────────────────────────────────────────

app.get('/users', requireAdmin, async (c) => {
  return c.json(await prisma.user.findMany({ select: userSelect, orderBy: { createdAt: 'asc' } }))
})

app.post('/users', requireAdmin, async (c) => {
  const { name, email, password = 'password123', role = 'user' } = await c.req.json()
  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { name, email, password: hashed, role } })
  const { password: _pw, ...safe } = user
  return c.json(safe, 201)
})

app.put('/users/:id', requireAdmin, async (c) => {
  const id = c.req.param('id') as string
  const { name, email, password, role } = await c.req.json()
  const data: Record<string, unknown> = { name, email, role }
  if (password) data.password = await bcrypt.hash(password, 10)
  const user = await prisma.user.update({ where: { id }, data })
  await cacheInvalidate(keys.userSession(id))
  const { password: _pw, ...safe } = user
  return c.json(safe)
})

app.delete('/users/:id', requireAdmin, async (c) => {
  const id = c.req.param('id') as string
  await prisma.user.delete({ where: { id } })
  await cacheInvalidate(keys.userSession(id))
  return c.json({ ok: true })
})

// ─── COMMENTS ────────────────────────────────────────────────────────────────

app.post('/recipes/:id/comments', requireAuth, async (c) => {
  const recipeId = c.req.param('id') as string
  const { content } = await c.req.json()
  const userId = c.get('jwt').sub
  const comment = await prisma.comment.create({
    data: { recipeId, userId, content },
    include: { user: { select: userSelect } },
  })
  await cacheInvalidate(keys.recipeDetail(recipeId))
  return c.json(comment, 201)
})

app.delete('/comments/:id', requireAuth, async (c) => {
  const jwt = c.get('jwt')
  const id = c.req.param('id') as string
  const comment = await prisma.comment.findUnique({ where: { id } })
  if (!comment) return c.json({ error: 'Not found' }, 404)
  if (comment.userId !== jwt.sub && jwt.role !== 'admin') return c.json({ error: 'Acceso denegado' }, 403)
  await prisma.comment.delete({ where: { id } })
  await cacheInvalidate(keys.recipeDetail(comment.recipeId))
  return c.json({ ok: true })
})

// ─── RATINGS ─────────────────────────────────────────────────────────────────

app.post('/recipes/:id/ratings', requireAuth, async (c) => {
  const recipeId = c.req.param('id') as string
  const userId = c.get('jwt').sub
  const { score } = await c.req.json()
  const rating = await prisma.rating.upsert({
    where: { recipeId_userId: { recipeId, userId } },
    update: { score },
    create: { recipeId, userId, score },
  })
  await cacheInvalidate(keys.recipeDetail(recipeId), 'recipes:list:*')
  return c.json(rating)
})

app.get('/recipes/:id/ratings/:userId', async (c) => {
  const recipeId = c.req.param('id') as string
  const userId = c.req.param('userId') as string
  const rating = await prisma.rating.findUnique({ where: { recipeId_userId: { recipeId, userId } } })
  return c.json(rating)
})

// ─── UPLOADS ─────────────────────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 10 * 1024 * 1024

const fileExt = (filename: string) => filename.split('.').pop()?.toLowerCase() ?? 'bin'
const sanitizeFilename = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_')

app.post('/upload/profile/:userId', requireAuth, async (c) => {
  const userId = c.req.param('userId') as string
  const jwt = c.get('jwt')
  if (jwt.sub !== userId && jwt.role !== 'admin') return c.json({ error: 'Acceso denegado' }, 403)

  const formData = await c.req.formData()
  const file = formData.get('file') as File | null
  if (!file) return c.json({ error: 'No se recibió ningún archivo' }, 400)
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return c.json({ error: 'Tipo de archivo no permitido' }, 400)
  if (file.size > MAX_FILE_SIZE) return c.json({ error: 'El archivo supera el límite de 10 MB' }, 400)

  const buffer = Buffer.from(await file.arrayBuffer())
  const url = await uploadFile(profileKey(userId, fileExt(file.name)), buffer, file.type)
  await prisma.user.update({ where: { id: userId }, data: { avatarUrl: url } })
  await cacheInvalidate(keys.userSession(userId))
  return c.json({ url })
})

app.delete('/upload/profile/:userId', requireAuth, async (c) => {
  const userId = c.req.param('userId') as string
  const jwt = c.get('jwt')
  if (jwt.sub !== userId && jwt.role !== 'admin') return c.json({ error: 'Acceso denegado' }, 403)

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } })
  if (user?.avatarUrl) {
    const k = keyFromUrl(user.avatarUrl)
    if (k) await deleteFile(k)
  }
  await prisma.user.update({ where: { id: userId }, data: { avatarUrl: null } })
  await cacheInvalidate(keys.userSession(userId))
  return c.json({ ok: true })
})

app.post('/upload/recipe/:recipeId', requireAdmin, async (c) => {
  const recipeId = c.req.param('recipeId') as string
  const formData = await c.req.formData()
  const file = formData.get('file') as File | null
  if (!file) return c.json({ error: 'No se recibió ningún archivo' }, 400)
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return c.json({ error: 'Tipo de archivo no permitido' }, 400)
  if (file.size > MAX_FILE_SIZE) return c.json({ error: 'El archivo supera el límite de 10 MB' }, 400)

  const buffer = Buffer.from(await file.arrayBuffer())
  const url = await uploadFile(recipeMediaKey(recipeId, sanitizeFilename(file.name)), buffer, file.type)
  await prisma.recipe.update({ where: { id: recipeId }, data: { imageUrl: url } })
  await cacheInvalidate(keys.recipeDetail(recipeId), 'recipes:list:*')
  return c.json({ url })
})

app.delete('/upload/recipe/:recipeId', requireAdmin, async (c) => {
  const recipeId = c.req.param('recipeId') as string
  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId }, select: { imageUrl: true } })
  if (recipe?.imageUrl) {
    const k = keyFromUrl(recipe.imageUrl)
    if (k) await deleteFile(k)
  }
  await prisma.recipe.update({ where: { id: recipeId }, data: { imageUrl: null } })
  await cacheInvalidate(keys.recipeDetail(recipeId), 'recipes:list:*')
  return c.json({ ok: true })
})

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
