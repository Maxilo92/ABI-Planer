import React from 'react'

export function SoftwareApplicationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ABI Planer',
    operatingSystem: 'Web',
    applicationCategory: 'EducationalApplication, BusinessApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    description: 'Die All-in-One Lösung für euren Abiball: Finanzplanung, Abstimmungen, Aufgabenverwaltung und das digitale Lehrer-Sammelalbum.',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '120',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
