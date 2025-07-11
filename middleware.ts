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
    
    // Log para debug
    console.log(`Middleware: Processing ${pathname}`);
    
    // Allow public routes
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      console.log(`Middleware: ${pathname} is public, allowing`);
      return NextResponse.next();
    }

    // Special handling for root path
    if (pathname === '/') {
      console.log('Middleware: Root path, allowing');
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

      console.log(`Middleware: Token for ${pathname}:`, token ? 'exists' : 'null');

      // Redirect to login if not authenticated
      if (!token) {
        console.log(`Middleware: No token, redirecting ${pathname} to login`);
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
      }

      // Check role-based access for admin-only routes
      const isAdminRoute = adminOnlyRoutes.some(route => pathname.startsWith(route));
      if (isAdminRoute && token.role !== 'QA Leader') {
        console.log(`Middleware: ${pathname} requires admin role, redirecting`);
        // Redirect to home if not authorized
        return NextResponse.redirect(new URL('/proyectos', request.url));
      }
      
      console.log(`Middleware: ${pathname} access granted`);
    } catch (tokenError) {
      console.error('Middleware: Error getting token:', tokenError);
      // In case of token error, redirect to login
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // En caso de error, redirigir a login en lugar de permitir acceso
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
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
