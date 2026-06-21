import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken, COOKIE } from '@/lib/jwt'

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(COOKIE)?.value
  if (!token) return redirectToLogin(request)

  const payload = await verifyToken(token)
  if (!payload) return redirectToLogin(request)

  if (request.nextUrl.pathname.startsWith('/admin') && payload.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*'],
}
