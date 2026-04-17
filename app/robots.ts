import type { MetadataRoute } from 'next'

export const runtime = 'edge'

// Stealth: this site is for URL-only access. No search engine indexing,
// no LLM training scrapers, no social preview crawlers. Wildcard catches
// well-behaved bots; explicit names cover crawlers that ignore '*'.
const BLOCKED_USER_AGENTS = [
  // Generic search engines
  'Googlebot',
  'Googlebot-Image',
  'Googlebot-News',
  'Googlebot-Video',
  'Storebot-Google',
  'Bingbot',
  'Slurp',
  'DuckDuckBot',
  'Baiduspider',
  'YandexBot',
  'Sogou',
  'Exabot',
  'facebot',
  'ia_archiver',
  'archive.org_bot',

  // LLM / AI training + answer-engine crawlers
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-Web',
  'Claude-SearchBot',
  'anthropic-ai',
  'CCBot',
  'Google-Extended',
  'PerplexityBot',
  'Perplexity-User',
  'Applebot',
  'Applebot-Extended',
  'Amazonbot',
  'Bytespider',
  'FacebookBot',
  'Meta-ExternalAgent',
  'Meta-ExternalFetcher',
  'cohere-ai',
  'cohere-training-data-crawler',
  'DuckAssistBot',
  'YouBot',
  'Diffbot',
  'AI2Bot',
  'ImagesiftBot',
  'Omgilibot',
  'Omgili',
  'Timpibot',
  'PetalBot',
  'SemrushBot',
  'AhrefsBot',
  'MJ12bot',
  'DotBot',
  'MauiBot',
  'ZoominfoBot',
  'TurnitinBot',
  'Scrapy',
  'HTTrack',
  'SiteAuditBot',
  'PanguBot',
  'Kangaroo Bot',
  'PhindBot',
  'Webzio-Extended',
  'ISSCyberRiskCrawler',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Explicit disallows for named bots (some ignore '*')
      ...BLOCKED_USER_AGENTS.map((ua) => ({ userAgent: ua, disallow: '/' })),
      // Catch-all
      { userAgent: '*', disallow: '/' },
    ],
    // No sitemap, no host — nothing to guide any crawler.
  }
}
