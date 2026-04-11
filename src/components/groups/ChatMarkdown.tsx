'use client'

import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface ChatMarkdownProps {
  content: string
  className?: string
  tone?: 'default' | 'inverse'
}

const ALLOWED_ELEMENTS = ['p', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'br'] as const

function isSafeHref(rawHref?: string): boolean {
  if (!rawHref) return false

  const href = rawHref.trim()
  if (!href) return false

  if (href.startsWith('/')) return true

  try {
    const parsed = new URL(href)
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

export function ChatMarkdown({ content, className, tone = 'default' }: ChatMarkdownProps) {
  const linkClassName =
    tone === 'inverse'
      ? 'font-semibold underline decoration-primary-foreground/60 underline-offset-2 text-primary-foreground/95 hover:text-primary-foreground'
      : 'font-semibold underline decoration-primary/40 underline-offset-2 text-primary hover:text-primary/90'

  const components: Components = {
    p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap break-words">{children}</p>,
    strong: ({ children }) => <strong className="font-black">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-2 last:mb-0">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-2 last:mb-0">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    a: ({ href, children }) => {
      if (!isSafeHref(href)) {
        return <span className="opacity-80">{children}</span>
      }

      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={linkClassName}>
          {children}
        </a>
      )
    },
  }

  return (
    <ReactMarkdown
      className={cn('text-sm leading-relaxed break-words', className)}
      remarkPlugins={[remarkGfm]}
      allowedElements={ALLOWED_ELEMENTS as unknown as string[]}
      skipHtml
      components={components}
    >
      {content}
    </ReactMarkdown>
  )
}