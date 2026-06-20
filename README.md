# LetsRecipe

Blog de recetas con panel de administración. Construido con Next.js 16, Hono, Prisma y MySQL.

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router) + React 19 |
| Lenguaje | TypeScript 5 (strict) |
| Estilos | Tailwind CSS 4 + DaisyUI 5 |
| API | Hono 4 (montado en `/api/[...route]`) |
| ORM | Prisma 6 |
| Base de datos | MySQL (Railway) |
| Iconos | Lucide React |
| Fuentes | Playfair Display + Inter (Google Fonts) |

## Estructura

```
app/
├── page.tsx                   # Inicio — grid de recetas, búsqueda, filtro por categoría
├── recipes/[id]/page.tsx      # Detalle de receta — ingredientes, comentarios, valoraciones
├── login/page.tsx             # Login con cookie httpOnly
├── admin/
│   ├── page.tsx               # Dashboard con estadísticas
│   ├── recipes/page.tsx       # CRUD de recetas
│   ├── categories/page.tsx    # CRUD de categorías y subcategorías
│   ├── ingredients/page.tsx   # CRUD de ingredientes
│   └── users/page.tsx         # CRUD de usuarios
├── components/
│   ├── Navbar.tsx             # Navegación + toggle de tema
│   └── ThemeProvider.tsx      # Contexto de tema (claro/oscuro)
└── api/[...route]/route.ts    # Todos los endpoints REST

lib/db.ts                      # Singleton de PrismaClient
prisma/
├── schema.prisma              # Modelos de BD
└── seed.ts                    # Datos de ejemplo
middleware.ts                  # Protección de rutas /admin
```

## Variables de entorno

Crea `.env.local` en la raíz:

```env
MYSQL_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE

# O las variables individuales (lib/db.ts las compone):
MYSQLUSER=root
MYSQLPASSWORD=
MYSQLHOST=localhost
MYSQLPORT=3306
MYSQL_DATABASE=letsrecipe
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
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm run db:push` | Sincroniza el schema de Prisma con la BD |
| `npm run db:seed` | Carga datos de ejemplo |
| `npm run db:studio` | Abre Prisma Studio (explorador visual de BD) |

## API

Todos los endpoints bajo `/api`:

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/auth/me` | Usuario actual (por cookie de sesión) |
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/logout` | Cerrar sesión |

### Recetas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/recipes` | Listar — soporta `?categoryId`, `?subcategoryId`, `?search` |
| POST | `/api/recipes` | Crear |
| GET | `/api/recipes/:id` | Detalle con ingredientes, comentarios y valoraciones |
| PUT | `/api/recipes/:id` | Actualizar (ingredientes en transacción) |
| DELETE | `/api/recipes/:id` | Eliminar |

### Categorías y subcategorías
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/categories` | Listar / Crear |
| PUT/DELETE | `/api/categories/:id` | Actualizar / Eliminar |
| GET/POST | `/api/subcategories` | Listar (soporta `?categoryId`) / Crear |
| PUT/DELETE | `/api/subcategories/:id` | Actualizar / Eliminar |

### Ingredientes y usuarios
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/ingredients` | Listar / Crear |
| PUT/DELETE | `/api/ingredients/:id` | Actualizar / Eliminar |
| GET/POST | `/api/users` | Listar / Crear |
| PUT/DELETE | `/api/users/:id` | Actualizar / Eliminar |

### Comentarios y valoraciones
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/recipes/:id/comments` | Añadir comentario |
| DELETE | `/api/comments/:id` | Eliminar comentario |
| POST | `/api/recipes/:id/ratings` | Valorar (upsert — 1 por usuario) |
| GET | `/api/recipes/:id/ratings/:userId` | Valoración de un usuario |

## Modelos de base de datos

```
User ──< Recipe >── Category
                └── Subcategory
Recipe ──< RecipeIngredient >── Ingredient
Recipe ──< Comment >── User
Recipe ──< Rating >── User   (unique por receta+usuario)
```

## Autenticación

Cookie `session` httpOnly con el ID del usuario. Expira en 7 días. El middleware protege todas las rutas `/admin` redirigiendo a `/login` si no hay sesión activa.

## Temas

Dos temas DaisyUI: `cupcake` (claro) y `dim` (oscuro). Persiste en `localStorage` bajo la clave `lr-theme`. Script inline en `<head>` aplica el tema antes de la hidratación para evitar flash.

## Usuarios de ejemplo (seed)

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@letsrecipe.com | admin123 | admin |
| maria@example.com | password123 | user |
| carlos@example.com | password123 | user |
