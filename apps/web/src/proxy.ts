import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

/**
 * Clerk Proxy (formerly Middleware)
 *
 * Protects routes and handles authentication redirects.
 * - Public routes: home, pricing, contact, blog, compare, terms, privacy, authorize callback, invite flow, platform OAuth callback
 * - Protected routes: dashboard, connections, clients, settings, access requests
 */

const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/contact',
  '/blog',
  '/blog/(.*)',
  '/compare',
  '/compare/(.*)',
  '/privacy-policy',
  '/terms',
  '/authorize/(.*)',
  '/invite/(.*)',
  '/platforms/callback',
  '/onboarding/(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  // Skip auth check for public routes
  if (isPublicRoute(request)) {
    return
  }

  // Skip auth check in development bypass mode
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development') {
    return
  }

  // Protect all other routes
  await auth.protect()
})

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and API routes
    // API routes are proxied to backend and should not be intercepted by Clerk
    '/((?!_next|api|agency-platforms|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
