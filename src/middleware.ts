// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Check if user is accessing admin routes
  const pathname = request.nextUrl.pathname;
  const isAdminPath = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/admin/login';
  
  // Allow login page
  if (isLoginPage) {
    return response;
  }
  
  if (isAdminPath) {
    // Get session for admin routes
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // If no session, redirect to login
    if (!session?.user) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};