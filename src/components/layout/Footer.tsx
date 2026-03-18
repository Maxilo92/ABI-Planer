'use client'

import Link from 'next/link'

export function Footer() {
  const version = '0.15.21' // I'll increment it as well
  
  return (
    <footer className="mt-auto border-t bg-background/95 backdrop-blur-sm py-6 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium">
          <span>&copy; {new Date().getFullYear()} Maximilian Priesnitz</span>
          <span className="hidden md:inline text-muted-foreground/30">•</span>
          <Link href="/impressum" className="hover:text-primary transition-colors">
            Impressum
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-secondary border border-border/50 text-[10px] font-bold tracking-tight">
            v{version}
          </span>
        </div>
      </div>
    </footer>
  )
}
