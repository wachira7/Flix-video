// proxy.ts (root level - route protection; Next 16 renamed "middleware" to "proxy")
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_PAGES = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email']

// Everything under app/(dashboard) and app/(admin) needs a session.
// Admin role checks still happen in the admin layout.
const PROTECTED = [
  '/dashboard', '/browse', '/library', '/search', '/ai-chat', '/watch-party',
  '/movie', '/tv', '/my-list', '/lists', '/profile', '/settings', '/subscription',
  '/social', '/analytics', '/trending', '/top-rated', '/new-releases', '/recently-added',
  '/admin',
]

const matches = (pathname: string, roots: string[]) =>
  roots.some((root) => pathname === root || pathname.startsWith(`${root}/`))

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname, search } = request.nextUrl

  if (matches(pathname, PROTECTED) && !token) {
    // Remember where they were going so login can send them back
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname + search)
    return NextResponse.redirect(loginUrl)
  }

  // Signed-in users don't need the auth pages
  if (matches(pathname, AUTH_PAGES) && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/login', '/signup', '/forgot-password', '/reset-password', '/verify-email',
    '/dashboard/:path*', '/browse/:path*', '/library/:path*', '/search/:path*', '/ai-chat/:path*',
    '/watch-party/:path*', '/movie/:path*', '/tv/:path*', '/my-list/:path*', '/lists/:path*',
    '/profile/:path*', '/settings/:path*', '/subscription/:path*', '/social/:path*', '/analytics/:path*',
    '/trending/:path*', '/top-rated/:path*', '/new-releases/:path*', '/recently-added/:path*', '/admin/:path*',
  ],
}
