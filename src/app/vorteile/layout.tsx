import type { Metadata } from 'next'
import VorteileClientLayout from './VorteileClientLayout'

export const metadata: Metadata = {
  title: 'Funktionen & Vorteile',
  description: 'Entdecke alle Funktionen des ABI Planers: Von der Finanzplanung über Abstimmungen bis hin zum digitalen Sammelalbum für Lehrer.',
  openGraph: {
    title: 'Funktionen & Vorteile | ABI Planer',
    description: 'Entdecke alle Funktionen des ABI Planers: Von der Finanzplanung über Abstimmungen bis hin zum digitalen Sammelalbum für Lehrer.',
  }
}

export default function VorteileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <VorteileClientLayout>{children}</VorteileClientLayout>
}
