'use client'

import { Card } from '@/components/ui/card'

export function MarkdownGuide() {
  const examples = [
    { label: 'Überschrift 1', syntax: '# Text' },
    { label: 'Überschrift 2', syntax: '## Text' },
    { label: 'Fett', syntax: '**Text**' },
    { label: 'Kursiv', syntax: '*Text* oder _Text_' },
    { label: 'Liste', syntax: '- Punkt' },
    { label: 'Nummeriert', syntax: '1. Punkt' },
    { label: 'Checkliste', syntax: '- [ ] Offen\n- [x] Erledigt' },
    { label: 'Link', syntax: '[Titel](https://...)' },
    { label: 'Tabelle', syntax: '| A | B |\n|---|---|\n| 1 | 2 |' },
    { label: 'Zitat', syntax: '> Text' },
    { label: 'Code', syntax: '`Code`' },
    { label: 'Durchgestrichen', syntax: '~~Text~~' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {examples.map((ex) => (
          <Card key={ex.label} className="p-3 bg-background border-border/40">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">{ex.label}</p>
            <code className="text-xs font-mono bg-muted px-2 py-1 rounded block whitespace-pre-wrap">
              {ex.syntax}
            </code>
          </Card>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground italic text-center">
        Tipp: Du kannst auch Emojis wie  oder  direkt verwenden!
      </p>
    </div>
  )
}
