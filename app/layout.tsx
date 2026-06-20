import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './index.css'
import Navbar from './components/Navbar'
import { ThemeProvider } from './components/ThemeProvider'
import Link from 'next/link'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'LetsRecipe — Recetas para todos',
  description: 'Blog de recetas con categorías, ingredientes, puntuaciones y comentarios.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-theme="cupcake" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('lr-theme');if(!t)t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dim':'cupcake';document.documentElement.setAttribute('data-theme',t)})()`,
          }}
        />
      </head>
      <body className="min-h-screen bg-base-200 font-sans">
        <ThemeProvider>
          <Navbar />
          {children}
          <footer className="bg-base-100 border-t border-base-200 mt-16">
            <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-playfair text-xl font-bold text-primary mb-3">🍳 LetsRecipe</h3>
                <p className="text-sm text-base-content/60 leading-relaxed">
                  Descubre, cocina y comparte las mejores recetas caseras de la comunidad.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-base-content/80">Explorar</h4>
                <ul className="space-y-2 text-sm text-base-content/60">
                  <li><Link href="/" className="hover:text-primary transition-colors">Todas las recetas</Link></li>
                  <li><Link href="/?categoryId=" className="hover:text-primary transition-colors">Por categoría</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-base-content/80">Cuenta</h4>
                <ul className="space-y-2 text-sm text-base-content/60">
                  <li><Link href="/login" className="hover:text-primary transition-colors">Iniciar sesión</Link></li>
                  <li><Link href="/admin" className="hover:text-primary transition-colors">Panel admin</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-base-200 py-4 text-center text-xs text-base-content/40">
              © 2024 LetsRecipe — Hecho con amor y Next.js + DaisyUI
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  )
}
