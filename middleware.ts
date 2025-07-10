import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
// Temporarily disabled audit middleware for performance
// import { auditMiddleware } from './src/middleware/auditMiddleware';

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/api/auth', '/favicon.ico'];
// Define routes that should only be accessible by QA Leader (admin)
const adminOnlyRoutes = [
  '/analistas', 
  '/celulas', 
  '/equipos', 
  '/usuarios'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Apply audit middleware to API routes - TEMPORARILY DISABLED
  // if (pathname.startsWith('/api/')) {
  //   return auditMiddleware(request);
  // }

  // Check for auth token
  const token = await getToken({ req: request });

  // Redirect to login if not authenticated
  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  // Check role-based access for admin-only routes
  const isAdminRoute = adminOnlyRoutes.some(route => pathname.startsWith(route));
  if (isAdminRoute && token.role !== 'QA Leader') {
    // Redirect to home if not authorized
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
