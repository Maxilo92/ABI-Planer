import type { MetadataRoute } from 'next'
import { adminDb } from '@/lib/firebase-admin-server'

const routes = ['/', '/vorteile', '/news']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')

  if (!siteUrl) {
    return []
  }

  const staticEntries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/' ? 'daily' : 'weekly',
    priority: route === '/' ? 1 : 0.7,
  }))

  try {
    const newsSnapshot = await adminDb().collection('news').get()
    const newsEntries: MetadataRoute.Sitemap = newsSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        url: `${siteUrl}/news/${doc.id}`,
        lastModified: data.created_at?.toDate() || new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      }
    })

    return [...staticEntries, ...newsEntries]
  } catch (error) {
    console.error('Error generating sitemap news entries:', error)
    return staticEntries
  }
}