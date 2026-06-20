export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  createdAt: string
}

export interface Category {
  id: string
  name: string
  slug: string
}

export interface Subcategory {
  id: string
  name: string
  slug: string
  categoryId: string
}

export interface Ingredient {
  id: string
  name: string
  unit: string
}

export interface RecipeIngredient {
  ingredientId: string
  quantity: number
}

export interface Comment {
  id: string
  recipeId: string
  userId: string
  content: string
  createdAt: string
}

export interface Rating {
  id: string
  recipeId: string
  userId: string
  score: number
}

export interface Recipe {
  id: string
  title: string
  description: string
  instructions: string
  imageUrl?: string
  categoryId: string
  subcategoryId?: string
  authorId: string
  ingredients: RecipeIngredient[]
  createdAt: string
}

export interface RecipeWithDetails extends Recipe {
  author?: User
  category?: Category
  subcategory?: Subcategory
  avgRating: number
  ratingCount: number
  commentCount: number
}

export interface CommentWithUser extends Comment {
  user?: User
}

export interface RecipeDetail extends Omit<RecipeWithDetails, 'ingredients'> {
  comments: CommentWithUser[]
  ratings: Rating[]
  ingredients: Array<RecipeIngredient & { ingredient?: Ingredient }>
}
