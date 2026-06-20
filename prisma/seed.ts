import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@letsrecipe.com' },
    update: {},
    create: { id: 'u1', name: 'Admin Chef', email: 'admin@letsrecipe.com', password: 'admin123', role: 'admin' },
  })
  const maria = await prisma.user.upsert({
    where: { email: 'maria@example.com' },
    update: {},
    create: { id: 'u2', name: 'María García', email: 'maria@example.com', password: 'maria123', role: 'user' },
  })
  const carlos = await prisma.user.upsert({
    where: { email: 'carlos@example.com' },
    update: {},
    create: { id: 'u3', name: 'Carlos López', email: 'carlos@example.com', password: 'carlos123', role: 'user' },
  })

  // Categories
  const cats = await Promise.all([
    prisma.category.upsert({ where: { slug: 'desayunos' }, update: {}, create: { id: 'c1', name: 'Desayunos', slug: 'desayunos' } }),
    prisma.category.upsert({ where: { slug: 'almuerzos' }, update: {}, create: { id: 'c2', name: 'Almuerzos', slug: 'almuerzos' } }),
    prisma.category.upsert({ where: { slug: 'cenas' },     update: {}, create: { id: 'c3', name: 'Cenas',     slug: 'cenas'     } }),
    prisma.category.upsert({ where: { slug: 'postres' },   update: {}, create: { id: 'c4', name: 'Postres',   slug: 'postres'   } }),
    prisma.category.upsert({ where: { slug: 'bebidas' },   update: {}, create: { id: 'c5', name: 'Bebidas',   slug: 'bebidas'   } }),
  ])

  // Subcategories
  await Promise.all([
    prisma.subcategory.upsert({ where: { slug: 'tostadas'   }, update: {}, create: { id: 'sc1',  name: 'Tostadas',    slug: 'tostadas',    categoryId: 'c1' } }),
    prisma.subcategory.upsert({ where: { slug: 'batidos'    }, update: {}, create: { id: 'sc2',  name: 'Batidos',     slug: 'batidos',     categoryId: 'c1' } }),
    prisma.subcategory.upsert({ where: { slug: 'ensaladas'  }, update: {}, create: { id: 'sc3',  name: 'Ensaladas',   slug: 'ensaladas',   categoryId: 'c2' } }),
    prisma.subcategory.upsert({ where: { slug: 'sopas'      }, update: {}, create: { id: 'sc4',  name: 'Sopas',       slug: 'sopas',       categoryId: 'c2' } }),
    prisma.subcategory.upsert({ where: { slug: 'pastas'     }, update: {}, create: { id: 'sc5',  name: 'Pastas',      slug: 'pastas',      categoryId: 'c2' } }),
    prisma.subcategory.upsert({ where: { slug: 'carnes'     }, update: {}, create: { id: 'sc6',  name: 'Carnes',      slug: 'carnes',      categoryId: 'c3' } }),
    prisma.subcategory.upsert({ where: { slug: 'pescados'   }, update: {}, create: { id: 'sc7',  name: 'Pescados',    slug: 'pescados',    categoryId: 'c3' } }),
    prisma.subcategory.upsert({ where: { slug: 'vegetariano'}, update: {}, create: { id: 'sc8',  name: 'Vegetariano', slug: 'vegetariano', categoryId: 'c3' } }),
    prisma.subcategory.upsert({ where: { slug: 'tartas'     }, update: {}, create: { id: 'sc9',  name: 'Tartas',      slug: 'tartas',      categoryId: 'c4' } }),
    prisma.subcategory.upsert({ where: { slug: 'galletas'   }, update: {}, create: { id: 'sc10', name: 'Galletas',    slug: 'galletas',    categoryId: 'c4' } }),
    prisma.subcategory.upsert({ where: { slug: 'smoothies'  }, update: {}, create: { id: 'sc11', name: 'Smoothies',   slug: 'smoothies',   categoryId: 'c5' } }),
    prisma.subcategory.upsert({ where: { slug: 'infusiones' }, update: {}, create: { id: 'sc12', name: 'Infusiones',  slug: 'infusiones',  categoryId: 'c5' } }),
  ])

  // Ingredients
  await Promise.all([
    prisma.ingredient.upsert({ where: { id: 'i1'  }, update: {}, create: { id: 'i1',  name: 'Harina',         unit: 'taza'       } }),
    prisma.ingredient.upsert({ where: { id: 'i2'  }, update: {}, create: { id: 'i2',  name: 'Huevo',          unit: 'unidad'     } }),
    prisma.ingredient.upsert({ where: { id: 'i3'  }, update: {}, create: { id: 'i3',  name: 'Leche',          unit: 'ml'         } }),
    prisma.ingredient.upsert({ where: { id: 'i4'  }, update: {}, create: { id: 'i4',  name: 'Azúcar',         unit: 'g'          } }),
    prisma.ingredient.upsert({ where: { id: 'i5'  }, update: {}, create: { id: 'i5',  name: 'Aceite de oliva',unit: 'cucharada'  } }),
    prisma.ingredient.upsert({ where: { id: 'i6'  }, update: {}, create: { id: 'i6',  name: 'Sal',            unit: 'g'          } }),
    prisma.ingredient.upsert({ where: { id: 'i7'  }, update: {}, create: { id: 'i7',  name: 'Tomate',         unit: 'unidad'     } }),
    prisma.ingredient.upsert({ where: { id: 'i8'  }, update: {}, create: { id: 'i8',  name: 'Cebolla',        unit: 'unidad'     } }),
    prisma.ingredient.upsert({ where: { id: 'i9'  }, update: {}, create: { id: 'i9',  name: 'Ajo',            unit: 'diente'     } }),
    prisma.ingredient.upsert({ where: { id: 'i10' }, update: {}, create: { id: 'i10', name: 'Queso',          unit: 'g'          } }),
    prisma.ingredient.upsert({ where: { id: 'i11' }, update: {}, create: { id: 'i11', name: 'Pollo',          unit: 'g'          } }),
    prisma.ingredient.upsert({ where: { id: 'i12' }, update: {}, create: { id: 'i12', name: 'Arroz',          unit: 'taza'       } }),
    prisma.ingredient.upsert({ where: { id: 'i13' }, update: {}, create: { id: 'i13', name: 'Pasta',          unit: 'g'          } }),
    prisma.ingredient.upsert({ where: { id: 'i14' }, update: {}, create: { id: 'i14', name: 'Mantequilla',    unit: 'g'          } }),
    prisma.ingredient.upsert({ where: { id: 'i15' }, update: {}, create: { id: 'i15', name: 'Chocolate',      unit: 'g'          } }),
    prisma.ingredient.upsert({ where: { id: 'i16' }, update: {}, create: { id: 'i16', name: 'Papa',           unit: 'unidad'     } }),
    prisma.ingredient.upsert({ where: { id: 'i17' }, update: {}, create: { id: 'i17', name: 'Pimiento',       unit: 'unidad'     } }),
    prisma.ingredient.upsert({ where: { id: 'i18' }, update: {}, create: { id: 'i18', name: 'Pepino',         unit: 'unidad'     } }),
    prisma.ingredient.upsert({ where: { id: 'i19' }, update: {}, create: { id: 'i19', name: 'Banana',         unit: 'unidad'     } }),
    prisma.ingredient.upsert({ where: { id: 'i20' }, update: {}, create: { id: 'i20', name: 'Limón',          unit: 'unidad'     } }),
  ])

  // Recipes (delete ingredients first for idempotency)
  const recipes = [
    {
      id: 'r1', title: 'Tortilla Española',
      description: 'La auténtica tortilla española con patatas y cebolla, jugosa por dentro y dorada por fuera.',
      instructions: '1. Pela y corta las papas en láminas finas.\n2. Fríe las papas y cebolla en aceite a fuego medio hasta que estén blandas (15 min).\n3. Escurre el aceite y reserva.\n4. Bate los huevos con sal, añade las papas y mezcla bien.\n5. En sartén con un poco de aceite, cuaja la tortilla a fuego medio.\n6. Da la vuelta con ayuda de un plato cuando esté cuajada por abajo.\n7. Cocina 2 minutos más y sirve.',
      imageUrl: 'https://picsum.photos/seed/tortilla/800/500',
      categoryId: 'c2', subcategoryId: 'sc3', authorId: 'u2',
      createdAt: new Date('2024-02-10T10:00:00Z'),
      ingredients: [{ ingredientId: 'i16', quantity: 4 }, { ingredientId: 'i2', quantity: 6 }, { ingredientId: 'i8', quantity: 1 }, { ingredientId: 'i5', quantity: 4 }, { ingredientId: 'i6', quantity: 2 }],
    },
    {
      id: 'r2', title: 'Gazpacho Andaluz',
      description: 'Sopa fría de tomate perfecta para el verano, refrescante y llena de sabor mediterráneo.',
      instructions: '1. Lava y trocea los tomates, pepino, pimiento y cebolla.\n2. Pon todos los vegetales en la batidora.\n3. Añade el ajo, aceite de oliva, sal y un trozo de pan remojado.\n4. Tritura a máxima potencia hasta obtener mezcla homogénea.\n5. Cuela con colador fino para textura suave.\n6. Refrigera mínimo 2 horas antes de servir.',
      imageUrl: 'https://picsum.photos/seed/gazpacho/800/500',
      categoryId: 'c2', subcategoryId: 'sc4', authorId: 'u3',
      createdAt: new Date('2024-03-05T09:00:00Z'),
      ingredients: [{ ingredientId: 'i7', quantity: 5 }, { ingredientId: 'i18', quantity: 1 }, { ingredientId: 'i17', quantity: 1 }, { ingredientId: 'i8', quantity: 0.5 }, { ingredientId: 'i9', quantity: 2 }, { ingredientId: 'i5', quantity: 3 }, { ingredientId: 'i6', quantity: 1 }],
    },
    {
      id: 'r3', title: 'Paella de Mariscos',
      description: 'El plato estrella de la cocina española, con arroz suelto y mariscos frescos al punto.',
      instructions: '1. Calienta aceite en la paellera y sofríe cebolla y ajo picados.\n2. Añade el tomate y pimiento troceados, sofríe 5 min.\n3. Incorpora el arroz y tuéstalo 2 minutos con el sofrito.\n4. Vierte el caldo caliente (doble de volumen que el arroz).\n5. Añade los mariscos y el azafrán.\n6. Cocina a fuego medio 18 minutos sin remover.\n7. Deja reposar 5 minutos tapado con papel aluminio.',
      imageUrl: 'https://picsum.photos/seed/paella/800/500',
      categoryId: 'c3', subcategoryId: 'sc7', authorId: 'u1',
      createdAt: new Date('2024-03-15T11:00:00Z'),
      ingredients: [{ ingredientId: 'i12', quantity: 2 }, { ingredientId: 'i8', quantity: 1 }, { ingredientId: 'i9', quantity: 3 }, { ingredientId: 'i7', quantity: 2 }, { ingredientId: 'i17', quantity: 1 }, { ingredientId: 'i5', quantity: 4 }, { ingredientId: 'i6', quantity: 2 }],
    },
    {
      id: 'r4', title: 'Churros con Chocolate',
      description: 'Los churros crujientes con chocolate espeso, el desayuno más querido de la cocina española.',
      instructions: '1. Hierve 250ml de agua con una pizca de sal.\n2. Fuera del fuego, añade la harina de golpe y mezcla con fuerza hasta masa homogénea.\n3. Pon la masa en la churrera o manga pastelera con boquilla estrella.\n4. Fríe en aceite a 180°C hasta dorado.\n5. Para el chocolate: calienta la leche, añade el chocolate troceado y azúcar.\n6. Remueve hasta espeso y sirve junto a los churros calientes.',
      imageUrl: 'https://picsum.photos/seed/churros/800/500',
      categoryId: 'c1', subcategoryId: 'sc1', authorId: 'u2',
      createdAt: new Date('2024-04-01T08:00:00Z'),
      ingredients: [{ ingredientId: 'i1', quantity: 1 }, { ingredientId: 'i6', quantity: 1 }, { ingredientId: 'i15', quantity: 100 }, { ingredientId: 'i3', quantity: 250 }, { ingredientId: 'i4', quantity: 30 }, { ingredientId: 'i5', quantity: 2 }],
    },
    {
      id: 'r5', title: 'Pan de Banana',
      description: 'Jugoso y esponjoso pan de banana casero, perfecto para aprovechar los plátanos maduros.',
      instructions: '1. Precalienta el horno a 180°C y engrasa un molde rectangular.\n2. Aplasta los bananas muy maduros con un tenedor hasta puré.\n3. Mezcla el puré con mantequilla derretida, azúcar y huevos batidos.\n4. Incorpora la harina tamizada y la levadura, mezcla sin sobrebatir.\n5. Vierte en el molde y hornea 55-60 minutos.\n6. Comprueba con palillo; si sale limpio, está listo.\n7. Deja enfriar 10 minutos antes de desmoldar.',
      imageUrl: 'https://picsum.photos/seed/bananabread/800/500',
      categoryId: 'c1', subcategoryId: null, authorId: 'u3',
      createdAt: new Date('2024-04-20T07:30:00Z'),
      ingredients: [{ ingredientId: 'i19', quantity: 3 }, { ingredientId: 'i1', quantity: 1.5 }, { ingredientId: 'i14', quantity: 80 }, { ingredientId: 'i4', quantity: 150 }, { ingredientId: 'i2', quantity: 2 }],
    },
    {
      id: 'r6', title: 'Pasta al Limón',
      description: 'Una pasta fresca y cremosa con el toque cítrico del limón, lista en 20 minutos.',
      instructions: '1. Cuece la pasta en agua con sal según instrucciones del paquete.\n2. Reserva 1 taza del agua de cocción antes de escurrir.\n3. En sartén grande, derrite la mantequilla a fuego medio.\n4. Añade ralladura y zumo de limón, mezcla.\n5. Incorpora la pasta escurrida y un poco del agua de cocción.\n6. Agrega el queso rallado y mezcla hasta salsa cremosa.\n7. Sirve con más queso y pimienta negra recién molida.',
      imageUrl: 'https://picsum.photos/seed/pastalemon/800/500',
      categoryId: 'c2', subcategoryId: 'sc5', authorId: 'u2',
      createdAt: new Date('2024-05-10T18:00:00Z'),
      ingredients: [{ ingredientId: 'i13', quantity: 300 }, { ingredientId: 'i14', quantity: 50 }, { ingredientId: 'i20', quantity: 1 }, { ingredientId: 'i10', quantity: 80 }, { ingredientId: 'i6', quantity: 1 }],
    },
  ]

  for (const { ingredients, ...data } of recipes) {
    await prisma.recipeIngredient.deleteMany({ where: { recipeId: data.id } })
    await prisma.recipe.upsert({
      where: { id: data.id },
      update: {},
      create: {
        ...data,
        ingredients: { createMany: { data: ingredients } },
      },
    })
  }

  // Comments
  const comments = [
    { id: 'cm1', recipeId: 'r1', userId: 'u3', content: '¡Quedó perfecta! La mejor tortilla que he hecho en casa.',     createdAt: new Date('2024-02-12T14:00:00Z') },
    { id: 'cm2', recipeId: 'r1', userId: 'u1', content: 'Excelente receta, muy bien explicada. Mis hijos la adoraron.',  createdAt: new Date('2024-02-15T10:00:00Z') },
    { id: 'cm3', recipeId: 'r2', userId: 'u2', content: 'Refrescante y delicioso para el verano, lo repetiré seguro.',   createdAt: new Date('2024-03-10T12:00:00Z') },
    { id: 'cm4', recipeId: 'r3', userId: 'u3', content: 'La paella quedó espectacular, el arroz en su punto justo.',    createdAt: new Date('2024-03-20T19:00:00Z') },
    { id: 'cm5', recipeId: 'r4', userId: 'u1', content: 'Los churros caseros son otra cosa completamente diferente. ¡Increíbles!', createdAt: new Date('2024-04-05T09:00:00Z') },
    { id: 'cm6', recipeId: 'r5', userId: 'u2', content: 'Aproveché los bananas maduros que tenía y salió delicioso.',   createdAt: new Date('2024-04-25T11:00:00Z') },
    { id: 'cm7', recipeId: 'r6', userId: 'u3', content: 'Rápida, fácil y deliciosa. Ya la hice dos veces esta semana.', createdAt: new Date('2024-05-15T20:00:00Z') },
  ]
  for (const cm of comments) {
    await prisma.comment.upsert({ where: { id: cm.id }, update: {}, create: cm })
  }

  // Ratings
  const ratings = [
    { id: 'rt1',  recipeId: 'r1', userId: 'u2', score: 5 },
    { id: 'rt2',  recipeId: 'r1', userId: 'u3', score: 4 },
    { id: 'rt3',  recipeId: 'r2', userId: 'u1', score: 5 },
    { id: 'rt4',  recipeId: 'r2', userId: 'u3', score: 4 },
    { id: 'rt5',  recipeId: 'r3', userId: 'u2', score: 5 },
    { id: 'rt6',  recipeId: 'r3', userId: 'u3', score: 5 },
    { id: 'rt7',  recipeId: 'r4', userId: 'u2', score: 4 },
    { id: 'rt8',  recipeId: 'r4', userId: 'u3', score: 5 },
    { id: 'rt9',  recipeId: 'r5', userId: 'u1', score: 4 },
    { id: 'rt10', recipeId: 'r6', userId: 'u1', score: 5 },
    { id: 'rt11', recipeId: 'r6', userId: 'u3', score: 4 },
  ]
  for (const rt of ratings) {
    await prisma.rating.upsert({ where: { recipeId_userId: { recipeId: rt.recipeId, userId: rt.userId } }, update: {}, create: rt })
  }

  console.log('Seed complete.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
