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
  try {
    const { pathname } = request.nextUrl;
    
    // Allow public routes
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // Special handling for root path
    if (pathname === '/') {
      // We'll let the homepage component handle redirection based on auth status
      return NextResponse.next();
    }

    // Apply audit middleware to API routes - TEMPORARILY DISABLED
    // if (pathname.startsWith('/api/')) {
    //   return auditMiddleware(request);
    // }

    // Check for auth token with detailed logging
    console.log('Middleware: Checking auth token for path:', pathname);
    
    // Log environment information for debugging
    if (process.env.VERCEL_ENV === 'production') {
      console.log('Middleware: Running in Vercel production environment');
      console.log('Middleware: NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
      // Don't log the actual secret, just whether it exists
      console.log('Middleware: NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
    }
    
    let token;
    try {
      token = await getToken({ 
        req: request,
        // Ensure we have a fallback secret in case the env var is missing
        secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_development_only"
      });

      // Redirect to login if not authenticated
      if (!token) {
        console.log('Middleware: No token found, redirecting to login');
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', encodeURI(request.url));
        return NextResponse.redirect(loginUrl);
      }
      
      console.log('Middleware: Token found, role:', token.role);

      // Check role-based access for admin-only routes
      const isAdminRoute = adminOnlyRoutes.some(route => pathname.startsWith(route));
      if (isAdminRoute && token.role !== 'QA Leader') {
        // Redirect to home if not authorized
        return NextResponse.redirect(new URL('/proyectos', request.url));
      }
    } catch (tokenError) {
      console.error('Middleware: Error getting token:', tokenError);
      // In case of token error, redirect to login
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // En caso de error, permitir que el componente de página maneje la redirección
    return NextResponse.next();
  }
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
