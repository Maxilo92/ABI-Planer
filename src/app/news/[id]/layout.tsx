import type { Metadata } from 'next'
import { adminDb } from '@/lib/firebase-admin-server'
import { NewsEntry } from '@/types/database'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  
  try {
    const doc = await adminDb().collection('news').doc(id).get()
    if (!doc.exists) {
      return {
        title: 'Beitrag nicht gefunden | ABI Planer'
      }
    }

    const data = doc.data() as NewsEntry
    // Remove markdown characters for description and truncate
    const description = data.content?.substring(0, 160)
      .replace(/[#*`_]/g, '')
      .replace(/\n/g, ' ')
      .trim() || 'Ein neuer Beitrag im ABI Planer News-Bereich.'
    
    const imageUrl = data.image_url || 'https://abi-planer.de/logo.png'
    const publishedTime = (data.created_at as any)?.toDate?.()?.toISOString() || 
                         (typeof data.created_at === 'string' ? data.created_at : undefined)

    return {
      title: `${data.title} | ABI Planer News`,
      description,
      openGraph: {
        title: data.title,
        description,
        images: [imageUrl],
        type: 'article',
        publishedTime,
        authors: [data.author_name || 'ABI Planer Team'],
      },
      twitter: {
        card: 'summary_large_image',
        title: data.title,
        description,
        images: [imageUrl],
      }
    }
  } catch (error) {
    console.error('Error generating metadata for news:', error)
    return {
      title: 'News | ABI Planer'
    }
  }
}

export default async function NewsArticleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let jsonLd = null

  try {
    const doc = await adminDb().collection('news').doc(id).get()
    if (doc.exists) {
      const data = doc.data() as NewsEntry
      const date = (data.created_at as any)?.toDate?.()?.toISOString() || 
                  (typeof data.created_at === 'string' ? data.created_at : new Date().toISOString())
      
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: data.title,
        image: data.image_url ? [data.image_url] : [],
        datePublished: date,
        dateModified: date,
        author: [{
          '@type': 'Person',
          name: data.author_name || 'ABI Planer Team',
        }],
        description: data.content?.substring(0, 160)
          .replace(/[#*`_]/g, '')
          .replace(/\n/g, ' ')
          .trim(),
      }
    }
  } catch (e) {
    console.error('Error generating JSON-LD for news:', e)
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  )
}
