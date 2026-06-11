import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key')

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get token from cookie or Authorization header
  const token = request.cookies.get('access_token')?.value || 
                request.headers.get('Authorization')?.replace('Bearer ', '')

  // Public routes (no auth required)
  const publicRoutes = ['/login', '/api/auth/login']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // If accessing public route
  if (isPublicRoute) {
    // If already logged in, redirect to dashboard
    if (token) {
      try {
        await jwtVerify(token, JWT_SECRET)
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } catch (err) {
        // Token invalid, allow access to login
      }
    }
    return NextResponse.next()
  }

  // Protected routes (auth required)
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verify token
  try {
    await jwtVerify(token, JWT_SECRET)
    return NextResponse.next()
  } catch (err) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)']
}
