import { NextResponse } from 'next/server';
 
export async function GET() {
  // IMPORTANT: In production, don't expose full environment details - this is just for debugging
  // Remove or secure this endpoint before deploying to production
  
  const debug = {
    environment: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV,
    nextauth_url: process.env.NEXTAUTH_URL ? 'Set' : 'Not set',
    nextauth_secret: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set',
    database_url: process.env.DATABASE_URL ? 'Set' : 'Not set',
    app_url: process.env.NEXT_PUBLIC_APP_URL,
    vercel_url: process.env.VERCEL_URL,
    // Add any other environment variables you want to check (don't include sensitive values)
  };
 
  return NextResponse.json(debug);
}
