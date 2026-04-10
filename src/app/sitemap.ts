import type { MetadataRoute } from 'next'

const routes = ['/', '/vorteile', '/news']

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')

  if (!siteUrl) {
    return []
  }

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/' ? 'daily' : 'weekly',
    priority: route === '/' ? 1 : 0.7,
  }))
}