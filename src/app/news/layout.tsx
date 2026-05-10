import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'News & Updates | ABI Planer',
  description: 'Bleibe auf dem Laufenden über neue Funktionen, Updates und Neuigkeiten rund um den ABI Planer.',
  openGraph: {
    title: 'News & Updates | ABI Planer',
    description: 'Bleibe auf dem Laufenden über neue Funktionen, Updates und Neuigkeiten rund um den ABI Planer.',
  }
}

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
