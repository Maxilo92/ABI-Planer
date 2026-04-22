import type { MetadataRoute } from 'next'

const disallowPaths = [
  '/admin/',
  '/login',
  '/register',
  '/agb',
  '/datenschutz',
  '/impressum',
  '/sammelkarten/kaempfe',
  '/r/',
]

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowPaths,
      },
    ],
    ...(siteUrl ? { sitemap: `${siteUrl}/sitemap.xml` } : {}),
  }
}