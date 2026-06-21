# LetsRecipe

Blog de recetas con panel de administración y área de usuario. Construido con Next.js 16, Hono, Prisma y MySQL.

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router) + React 19 |
| Lenguaje | TypeScript 5 (strict) |
| Estilos | Tailwind CSS 4 + DaisyUI 5 |
| API | Hono 4 (montado en `/api/[...route]`) |
| ORM | Prisma 6 |
| Base de datos | MySQL (Railway) |
| Autenticación | JWT (`jose`) — cookie httpOnly `token`, 7 días |
| Caché | Redis (`ioredis`) — opcional, degradación elegante |
| Almacenamiento | S3-compatible (`@aws-sdk/client-s3`) |
| Fuentes | Playfair Display + Inter (Google Fonts) |

## Estructura

```
app/
├── page.tsx                   # Inicio — grid de recetas, búsqueda y filtros
├── login/page.tsx             # Login con cookie httpOnly JWT
├── profile/page.tsx           # Panel de usuario — perfil, avatar, mis recetas
├── recipes/[id]/
│   ├── page.tsx               # Detalle SSR con JSON-LD y OpenGraph
│   └── RecipeInteractions.tsx # Comentarios y valoraciones (client)
├── admin/
│   ├── layout.tsx             # Sidebar drawer responsivo (CSS-only)
│   ├── page.tsx               # Dashboard con estadísticas
│   ├── recipes/page.tsx       # CRUD de recetas
│   ├── categories/page.tsx    # CRUD de categorías y subcategorías
│   ├── ingredients/page.tsx   # CRUD de ingredientes
│   └── users/page.tsx         # CRUD de usuarios
├── components/
│   ├── AuthProvider.tsx        # Contexto global de sesión
│   ├── AdminGuard.tsx          # Guard client-side de rol admin
│   ├── FooterAccount.tsx       # Sección "Cuenta" del footer reactiva a sesión
│   ├── Navbar.tsx              # Navegación + toggle de tema
│   └── ThemeProvider.tsx       # Contexto de tema (claro/oscuro)
└── api/[...route]/route.ts    # Todos los endpoints REST (Hono)

lib/
├── db.ts                      # Singleton de PrismaClient
├── jwt.ts                     # signToken / verifyToken (jose, HS256)
├── redis.ts                   # Cache con TTL y degradación sin Redis
└── s3.ts                      # Upload / delete en bucket S3-compatible

proxy.ts                       # Protección de rutas /admin con JWT
prisma/
├── schema.prisma              # Modelos de BD
└── seed.ts                    # Datos de ejemplo (contraseñas con bcrypt)
```

## Variables de entorno

Crea `.env.local` en la raíz:

```env
# Base de datos
MYSQL_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE

# JWT — genera con: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
JWT_SECRET=your-secret-here

# URL pública (usada en sitemap y OpenGraph)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Redis (opcional — la app funciona sin él)
REDIS_URL=redis://localhost:6379

# S3-compatible (Cloudflare R2, MinIO, AWS S3, etc.)
BUCKET=nombre-del-bucket
REGION=auto
ENDPOINT=https://tu-endpoint.com
ACCESS_KEY_ID=tu-access-key
SECRET_ACCESS_KEY=tu-secret-key
```

## Puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Crear tablas en la base de datos
npm run db:push

# 3. Cargar datos de ejemplo (opcional)
npm run db:seed

# 4. Arrancar servidor de desarrollo
npm run dev
```

La app queda disponible en `http://localhost:3000`.

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo (Turbopack) |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm run db:push` | Sincroniza el schema de Prisma con la BD |
| `npm run db:seed` | Carga datos de ejemplo con contraseñas hasheadas |
| `npm run db:studio` | Abre Prisma Studio (explorador visual de BD) |

## API

Todos los endpoints bajo `/api`. Los que requieren sesión usan la cookie `token` (JWT httpOnly).

### Auth
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/auth/me` | — | Usuario actual (por cookie JWT) |
| POST | `/api/auth/login` | — | Iniciar sesión → devuelve usuario y establece cookie |
| POST | `/api/auth/logout` | ✓ | Cerrar sesión → invalida caché y borra cookie |

### Recetas
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/recipes` | — | Listar — soporta `?categoryId`, `?subcategoryId`, `?search`, `?authorId` |
| POST | `/api/recipes` | ✓ usuario | Crear — el autor se fija desde el JWT |
| GET | `/api/recipes/:id` | — | Detalle completo (ingredientes, comentarios, valoraciones) |
| PUT | `/api/recipes/:id` | ✓ autor/admin | Actualizar (ingredientes en transacción) |
| DELETE | `/api/recipes/:id` | ✓ autor/admin | Eliminar |

### Categorías y subcategorías
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/categories` | — | Listar |
| POST/PUT/DELETE | `/api/categories[/:id]` | ✓ admin | Crear / Actualizar / Eliminar |
| GET | `/api/subcategories` | — | Listar (soporta `?categoryId`) |
| POST/PUT/DELETE | `/api/subcategories[/:id]` | ✓ admin | Crear / Actualizar / Eliminar |

### Ingredientes
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/ingredients` | — | Listar |
| POST/PUT/DELETE | `/api/ingredients[/:id]` | ✓ admin | Crear / Actualizar / Eliminar |

### Usuarios
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/users` | ✓ admin | Listar |
| POST | `/api/users` | ✓ admin | Crear |
| PUT | `/api/users/:id` | ✓ propio/admin | Actualizar nombre/email (solo admin puede cambiar rol) |
| DELETE | `/api/users/:id` | ✓ admin | Eliminar |

### Comentarios y valoraciones
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/recipes/:id/comments` | ✓ usuario | Añadir comentario (userId desde JWT) |
| DELETE | `/api/comments/:id` | ✓ autor/admin | Eliminar comentario |
| POST | `/api/recipes/:id/ratings` | ✓ usuario | Valorar (upsert — 1 por usuario) |
| GET | `/api/recipes/:id/ratings/:userId` | — | Valoración de un usuario |

### Uploads
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/upload/profile/:userId` | ✓ propio/admin | Subir avatar (JPG/PNG/WebP, máx 10 MB) |
| DELETE | `/api/upload/profile/:userId` | ✓ propio/admin | Eliminar avatar |
| POST | `/api/upload/recipe/:recipeId` | ✓ autor/admin | Subir imagen de receta |
| DELETE | `/api/upload/recipe/:recipeId` | ✓ autor/admin | Eliminar imagen de receta |

## Modelos de base de datos

```
User ──< Recipe >── Category
                └── Subcategory
Recipe ──< RecipeIngredient >── Ingredient
Recipe ──< Comment >── User
Recipe ──< Rating >── User   (unique por receta+usuario)
User.avatarUrl → S3 key
Recipe.imageUrl → S3 key
```

## Autenticación y roles

- Cookie `token` httpOnly, firmada con HS256 (`jose`), TTL 7 días.
- `proxy.ts` protege rutas `/admin/*` a nivel de middleware: redirige a `/login` sin JWT válido y a `/` si el rol no es `admin`.
- `AdminGuard` (client-side) añade una segunda capa de protección dentro del layout de admin.
- Roles: `user` (puede publicar y gestionar sus propias recetas) y `admin` (acceso total).

## Almacenamiento de archivos

Rutas en bucket S3-compatible:

| Tipo | Patrón |
|------|--------|
| Avatar de usuario | `profile/{userId}/profile.{ext}` |
| Imagen de receta | `recipe/{recipeId}/media/{filename}` |

La URL pública se construye con `{ENDPOINT}/{BUCKET}/{key}` y se almacena en `User.avatarUrl` / `Recipe.imageUrl`.

## SEO

- `generateMetadata` por página con título, descripción, OpenGraph e imágenes.
- JSON-LD schema `Recipe` en páginas de detalle.
- `app/sitemap.ts` dinámico con todas las recetas.
- `app/robots.ts` bloquea `/admin/` y `/api/`.

## Temas

Dos temas DaisyUI: `cupcake` (claro) y `dim` (oscuro). Persisten en `localStorage` bajo la clave `lr-theme`. Script inline en `<head>` aplica el tema antes de la hidratación para evitar flash.

## Usuarios de ejemplo (seed)

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@letsrecipe.com | admin123 | admin |
| maria@example.com | maria123 | user |
| carlos@example.com | carlos123 | user |
