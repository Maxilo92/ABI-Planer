'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { Loader2, Sparkles, Send } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { db } from '@/lib/firebase'
import { collection, addDoc } from 'firebase/firestore'
import { toast } from 'sonner'
import { logAction } from '@/lib/logging'

type ChangelogEntry = {
  entryId: string
  version: string
  date: string
  title: string
  body: string
}

const INFINITE_SCROLL_BATCH_SIZE = 12

const VERSION_HEADER_PATTERN = /^## \[([^\]]+)\](?:\s*-\s*(.+))?$/

function parseHeader(heading: string) {
  const headingMatch = heading.match(VERSION_HEADER_PATTERN)
  if (!headingMatch) {
    return null
  }

  const version = (headingMatch[1] || '').trim()
  const trailing = (headingMatch[2] || '').trim()

  if (!trailing) {
    return { version, date: '', title: '' }
  }

  const parts = trailing.split(/\s+-\s+/).map((part) => part.trim()).filter(Boolean)
  const firstPart = parts[0] || ''
  const isDateLike = /^\d{4}-\d{2}-\d{2}$/i.test(firstPart) || /^unreleased$/i.test(firstPart)

  if (isDateLike) {
    return {
      version,
      date: firstPart,
      title: parts.slice(1).join(' - '),
    }
  }

  return {
    version,
    date: '',
    title: parts.join(' - '),
  }
}

function parseChangelog(markdown: string): ChangelogEntry[] {
  const normalized = markdown.replace(/\r\n/g, '\n')
  const lines = normalized.split('\n')
  const headerIndexes: number[] = []

  lines.forEach((line, index) => {
    if (line.startsWith('## [')) {
      headerIndexes.push(index)
    }
  })

  const entries: ChangelogEntry[] = []

  for (let i = 0; i < headerIndexes.length; i += 1) {
    const startIndex = headerIndexes[i]
    const endIndex = i + 1 < headerIndexes.length ? headerIndexes[i + 1] : lines.length
    const chunk = lines.slice(startIndex, endIndex)
    const heading = chunk[0]?.trim() || ''
    const parsedHeader = parseHeader(heading)

    if (!parsedHeader) {
      continue
    }

    const body = chunk.slice(1).join('\n').trim()

    entries.push({
      entryId: `${startIndex}`,
      version: parsedHeader.version,
      date: parsedHeader.date,
      title: parsedHeader.title,
      body,
    })
  }

  return entries
}

export default function AdminChangelogPage() {
  const { profile, user, loading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const [changelogRaw, setChangelogRaw] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [versionFilter, setVersionFilter] = useState('')
  const [visibleCount, setVisibleCount] = useState(INFINITE_SCROLL_BATCH_SIZE)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null)

  // Selection & News Generation
  const [selectedEntries, setSelectedEntries] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState<string | null>(null)

  const handleGenerateNews = async () => {
    if (selectedEntries.length === 0) return

    setIsGenerating(true)
    
    // Artificial delay for "feel good" factor
    const steps = [
      'Analysiere Changelog-Einträge...',
      'Extrahiere wichtigste Neuerungen...',
      'KI formuliert News-Beitrag...',
      'Optimiere Markdown-Formatierung...',
      'Bereite Editor vor...'
    ]

    let stepIndex = 0
    const stepInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        setGenerationStep(steps[stepIndex])
        stepIndex++
      }
    }, 800)

    try {
      const entriesToSummarize = changelogEntries.filter(e => selectedEntries.includes(e.entryId))
      const response = await fetch('/api/admin/changelog/generate-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: entriesToSummarize }),
      })
      
      const data = await response.json()
      
      // Ensure at least 4 seconds have passed for "high quality feel"
      await new Promise(resolve => setTimeout(resolve, 4000))
      
      if (data.ok) {
        const queryParams = new URLSearchParams({
          create: 'true',
          title: data.title,
          content: data.content,
          ai: 'true'
        }).toString()
        
        router.push(`/news?${queryParams}`)
      } else {
        toast.error('News konnten nicht generiert werden.')
      }
    } catch (err) {
      console.error('Error generating news:', err)
      toast.error('KI-Verbindung fehlgeschlagen.')
    } finally {
      clearInterval(stepInterval)
      setIsGenerating(false)
      setGenerationStep(null)
    }
  }

  const isAdmin = profile?.role === 'admin_main' || profile?.role === 'admin_co' || profile?.role === 'admin'

  useEffect(() => {
    if (authLoading) return

    if (!isAdmin) {
      router.replace(`/unauthorized?reason=admin&from=${encodeURIComponent(pathname)}`)
    }
  }, [authLoading, isAdmin, pathname, router])

  useEffect(() => {
    const loadChangelog = async () => {
      if (authLoading) return
      if (!isAdmin) {
        setLoading(false)
        return
      }
      if (!user) {
        setError('Authentifizierung nicht verfügbar. Bitte Seite neu laden.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const token = await user.getIdToken()
        const response = await fetch('/admin/api/changelog', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const payload = await response.json()
        if (!response.ok || !payload?.ok) {
          if (response.status === 403) {
            throw new Error('Zugriff verweigert (403). Bitte neu anmelden oder Admin-Rolle prüfen.')
          }
          throw new Error(payload?.error || 'Changelog konnte nicht geladen werden')
        }

        setChangelogRaw(payload.data?.content || '')
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Unbekannter Fehler'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    loadChangelog()
  }, [authLoading, isAdmin, user])

  const changelogEntries = useMemo(() => parseChangelog(changelogRaw), [changelogRaw])

  const uniqueVersions = useMemo(
    () => Array.from(new Set(changelogEntries.map((entry) => entry.version))),
    [changelogEntries],
  )

  const filteredEntries = useMemo(() => {
    const normalizedFilter = versionFilter.trim().toLowerCase()
    if (!normalizedFilter) return changelogEntries

    return changelogEntries.filter((entry) => entry.version.toLowerCase().includes(normalizedFilter))
  }, [changelogEntries, versionFilter])

  const visibleEntries = useMemo(
    () => filteredEntries.slice(0, visibleCount),
    [filteredEntries, visibleCount],
  )

  const hasMoreEntries = visibleEntries.length < filteredEntries.length

  useEffect(() => {
    setVisibleCount(INFINITE_SCROLL_BATCH_SIZE)
    setIsLoadingMore(false)
  }, [versionFilter, changelogRaw])

  useEffect(() => {
    if (!hasMoreEntries) return

    const sentinel = loadMoreSentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || isLoadingMore) return

        setIsLoadingMore(true)
        setVisibleCount((previousVisibleCount) => (
          Math.min(previousVisibleCount + INFINITE_SCROLL_BATCH_SIZE, filteredEntries.length)
        ))
      },
      {
        root: null,
        rootMargin: '240px 0px',
        threshold: 0,
      },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [filteredEntries.length, hasMoreEntries, isLoadingMore])

  useEffect(() => {
    if (!isLoadingMore) return
    setIsLoadingMore(false)
  }, [visibleCount, isLoadingMore])

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Lade Changelog...</div>
  }

  if (!isAdmin) {
    return <div className="flex items-center justify-center min-h-[50vh]">Zugriff verweigert.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Changelog</h1>
          <p className="text-muted-foreground">Nur für Admins: Release-Historie mit Versionsfilter.</p>
        </div>
        <Button 
          onClick={handleGenerateNews} 
          disabled={isGenerating || selectedEntries.length === 0}
          className="gap-2 shrink-0 min-w-[180px]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="animate-pulse">{generationStep || 'Wird generiert...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              News generieren ({selectedEntries.length})
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Version filtern</CardTitle>
          <CardDescription>
            Gefundene Einträge: {filteredEntries.length} von {changelogEntries.length} (sichtbar: {visibleEntries.length})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={versionFilter}
            onChange={(event) => setVersionFilter(event.target.value)}
            placeholder="z.B. 1.4.18"
          />

          <Select value={versionFilter || '__all__'} onValueChange={(value: string | null) => setVersionFilter(value === '__all__' ? '' : (value || ''))}>
            <SelectTrigger className="w-full md:w-[260px]">
              <SelectValue placeholder="Version auswählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Alle Versionen</SelectItem>
              {uniqueVersions.map((version) => (
                <SelectItem key={version} value={version}>
                  {version}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {filteredEntries.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Keine Changelog-Einträge für diesen Versionsfilter gefunden.
            </CardContent>
          </Card>
        )}

        {visibleEntries.map((entry) => (
          <Card key={entry.entryId} className={selectedEntries.includes(entry.entryId) ? 'border-primary/50 bg-primary/5' : ''}>
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Checkbox 
                    checked={selectedEntries.includes(entry.entryId)}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedEntries(prev => [...prev, entry.entryId])
                      else setSelectedEntries(prev => prev.filter(id => id !== entry.entryId))
                    }}
                  />
                  <Badge variant="secondary">v{entry.version}</Badge>
                  {entry.date && <Badge variant="outline">{entry.date}</Badge>}
                </div>
              </div>
              <CardTitle className="text-xl">{entry.title || 'Release'}</CardTitle>
            </CardHeader>
            <CardContent>
              {entry.body ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.body}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Keine Details vorhanden.</p>
              )}
            </CardContent>
          </Card>
        ))}

        <div ref={loadMoreSentinelRef} className="h-1" aria-hidden />

        {hasMoreEntries && (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Weitere Einträge werden automatisch geladen... ({visibleEntries.length}/{filteredEntries.length})
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}