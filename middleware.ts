import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/api/auth', '/favicon.ico', '/_next', '/images', '/api/debug'];
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

    // Usar una clave simple para desarrollo
    let token;
    try {
      token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET || "ClaveGeneradaParaDesarrolloLocalNoUsarEnProduccion123"
      });

      // Redirect to login if not authenticated
      if (!token) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
      }

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
