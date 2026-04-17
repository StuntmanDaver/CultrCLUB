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
  // NOTE: Do NOT add facebookexternalhit / Twitterbot / Slackbot /
  // LinkedInBot / TelegramBot / WhatsApp / Discordbot here — those are
  // link-preview bots. They're explicitly allowed below so iMessage and
  // other messengers render the OpenGraph thumbnail.
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

// Link-preview bots used by iMessage, Slack, Twitter, Discord, WhatsApp,
// Telegram, LinkedIn. These only fetch OpenGraph + favicon for thumbnail
// rendering — they do NOT index or train LLMs. Explicitly allowed so
// shared URLs show a proper preview card.
const PREVIEW_BOTS = [
  'facebookexternalhit',  // Meta AND iMessage on iOS use this UA
  'facebookcatalog',
  'Twitterbot',
  'Slackbot',
  'Slackbot-LinkExpanding',
  'Slack-ImgProxy',
  'LinkedInBot',
  'Discordbot',
  'TelegramBot',
  'WhatsApp',
  'SkypeUriPreview',
  'Pinterestbot',
  'redditbot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Preview bots: allow full access for thumbnail rendering
      ...PREVIEW_BOTS.map((ua) => ({ userAgent: ua, allow: '/' })),
      // Explicit disallows for search + LLM bots (some ignore '*')
      ...BLOCKED_USER_AGENTS.map((ua) => ({ userAgent: ua, disallow: '/' })),
      // Catch-all for everyone else
      { userAgent: '*', disallow: '/' },
    ],
    // No sitemap, no host — nothing to guide any crawler.
  }
}
