export const runtime = 'edge'

import { NextResponse, type NextRequest } from 'next/server'
import {
  handleClickTracking,
  serializeAttributionCookie,
} from '@/lib/creators/attribution'
import { getCookieDomain } from '@/lib/utils'
import { COMMISSION_CONFIG } from '@/lib/config/affiliate'

// Slug must match the tracking_links.slug validation used in the admin app:
// alphanumeric + hyphens, up to 64 chars. Anything else falls through to /
// so accidental paths (asset URLs, typos) don't hit the DB.
const SLUG_PATTERN = /^[a-zA-Z0-9-]{1,64}$/

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Bail early on anything that doesn't look like a valid tracking slug
  // (file extensions, reserved paths, etc.). Redirect to the home page.
  if (!SLUG_PATTERN.test(slug)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const hostname = request.nextUrl.hostname
  const cookieDomain = getCookieDomain(hostname)
  const isSecure = process.env.NODE_ENV === 'production'

  try {
    const ip = getClientIp(request)
    const userAgent = request.headers.get('user-agent') || ''
    const referer = request.headers.get('referer') || undefined
    const existingSessionId = request.cookies.get('cultr_session_id')?.value

    const result = await handleClickTracking({
      slug,
      ip,
      userAgent,
      referer,
      existingSessionId,
    })

    if (!result.success) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    const response = NextResponse.redirect(
      new URL(result.destinationPath, request.url)
    )

    if (result.cookieData) {
      response.cookies.set(
        COMMISSION_CONFIG.attributionCookieName,
        serializeAttributionCookie(result.cookieData),
        {
          httpOnly: true,
          secure: isSecure,
          sameSite: 'lax',
          maxAge: Math.floor(COMMISSION_CONFIG.attributionWindowMs / 1000),
          path: '/',
          ...(cookieDomain ? { domain: cookieDomain } : {}),
        }
      )
    }

    response.cookies.set('cultr_session_id', result.sessionId, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    })

    return response
  } catch (error) {
    console.error('[slug tracking] Error:', error instanceof Error ? error.message : 'unknown')
    return NextResponse.redirect(new URL('/', request.url))
  }
}
