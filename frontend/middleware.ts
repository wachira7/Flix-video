// middleware.ts (root level - for route protection)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/signup') ||
                     request.nextUrl.pathname.startsWith('/forgot-password') ||
                     request.nextUrl.pathname.startsWith('/reset-password') ||
                     request.nextUrl.pathname.startsWith('/verify-email')
  
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard') ||
                          request.nextUrl.pathname.startsWith('/movie') ||
                          request.nextUrl.pathname.startsWith('/tv') ||
                          request.nextUrl.pathname.startsWith('/my-list') ||
                          request.nextUrl.pathname.startsWith('/search') ||
                          request.nextUrl.pathname.startsWith('/profile') ||
                          request.nextUrl.pathname.startsWith('/settings')
  
  // Redirect to login if accessing dashboard without token
  if (isDashboardPage && !token) {
    // Remember where they were going so login can send them back
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }
  
  // Redirect to dashboard if accessing auth pages with token
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/movie/:path*', '/tv/:path*', '/my-list', '/search', '/profile', '/settings']
}