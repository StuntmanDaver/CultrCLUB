import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { hostname } = request.nextUrl

  // Canonicalize: redirect www.cultrclub.com → cultrclub.com (301).
  // Keeps only one discoverable hostname in CT logs and passive DNS.
  if (hostname === 'www.cultrclub.com') {
    const url = request.nextUrl.clone()
    url.hostname = 'cultrclub.com'
    return NextResponse.redirect(url, 301)
  }

  const response = NextResponse.next()

  // Stealth: block every crawler at the HTTP layer for dynamic routes.
  // _headers covers static assets; middleware covers Worker-served HTML/SSR.
  //
  // EXCEPTION: link-preview bots (iMessage, Slack, Twitter, Discord, etc.)
  // should NOT get the noindex/nosnippet header — otherwise they won't
  // render a thumbnail for shared URLs. Their UAs are well-known and
  // non-spoofable for our purposes (spoofing an iMessage preview doesn't
  // help an attacker scrape us). Indexing is still blocked because these
  // bots only fetch metadata, don't crawl links, and don't feed search.
  const ua = request.headers.get('user-agent') || ''
  const isPreviewBot = /facebookexternalhit|facebookcatalog|Twitterbot|Slackbot|Slack-ImgProxy|LinkedInBot|Discordbot|TelegramBot|WhatsApp|SkypeUriPreview|Pinterestbot|redditbot/i.test(ua)

  if (!isPreviewBot) {
    response.headers.set(
      'X-Robots-Tag',
      'noindex, nofollow, noarchive, nosnippet, noimageindex, nocache',
    )
  }
  response.headers.set('Referrer-Policy', 'no-referrer')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // UTM first-touch tracking
  if (!request.cookies.get('cultr_visitor_ctx')) {
    const utmSource = (request.nextUrl.searchParams.get('utm_source') || '').slice(0, 255)
    const utmMedium = (request.nextUrl.searchParams.get('utm_medium') || '').slice(0, 255)
    const utmCampaign = (request.nextUrl.searchParams.get('utm_campaign') || '').slice(0, 255)
    const utmTerm = (request.nextUrl.searchParams.get('utm_term') || '').slice(0, 255)
    const utmContent = (request.nextUrl.searchParams.get('utm_content') || '').slice(0, 255)
    const referrer = (request.headers.get('referer') || '').slice(0, 2048)

    const visitorCtx = JSON.stringify({
      s: utmSource, m: utmMedium, c: utmCampaign,
      t: utmTerm, n: utmContent, r: referrer,
      l: request.nextUrl.pathname + request.nextUrl.search,
      ts: Date.now(),
    })

    const domain = hostname.includes('cultrclub.com') ? '.cultrclub.com' : undefined
    response.cookies.set('cultr_visitor_ctx', visitorCtx, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      ...(domain ? { domain } : {}),
    })
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
