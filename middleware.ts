import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Temporarily disabled audit middleware for performance
// import { auditMiddleware } from './src/middleware/auditMiddleware';

export function middleware(request: NextRequest) {
  // Apply audit middleware to API routes - TEMPORARILY DISABLED
  // if (request.nextUrl.pathname.startsWith('/api/')) {
  //   return auditMiddleware(request);
  // }

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
