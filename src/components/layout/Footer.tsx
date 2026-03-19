'use client'

import Link from 'next/link'

export function Footer() {
  const version = '0.15.24' // Increment version
  
  return (
    <footer className="mt-auto border-t bg-background/95 backdrop-blur-sm py-6 px-6 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 font-medium">
          <span>&copy; {new Date().getFullYear()} Maximilian Priesnitz</span>
          <span className="hidden md:inline text-muted-foreground/30 mx-1">•</span>
          <Link href="/impressum" className="hover:text-primary transition-colors py-1 px-2 rounded-md hover:bg-secondary/50">
            Impressum
          </Link>
          <span className="text-muted-foreground/30 mx-1">•</span>
          <Link href="/agb" className="hover:text-primary transition-colors py-1 px-2 rounded-md hover:bg-secondary/50">
            AGB
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full bg-secondary border border-border/50 text-[10px] font-bold tracking-wider">
            v{version}
          </span>
        </div>
      </div>
    </footer>
  )
}
