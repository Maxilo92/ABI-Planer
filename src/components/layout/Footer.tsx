'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { toast } from 'sonner'

export function Footer() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0'
  const { profile, user } = useAuth()
  const [clickCount, setClickCount] = useState(0)
  const [showFeedback, setShowFeedback] = useState<string | null>(null)

  const handleVersionClick = async () => {
    if (profile?.easter_egg_unlocked) return

    const newCount = clickCount + 1
    setClickCount(newCount)

    if (newCount === 1) {
      setShowFeedback('?')
    } else if (newCount === 2) {
      setShowFeedback('😠')
    } else if (newCount === 3) {
      if (user) {
        try {
          await updateDoc(doc(db, 'profiles', user.uid), {
            easter_egg_unlocked: true
          })
          toast.success('Geheimnis freigeschaltet! Schau mal in dein Menü...', {
            icon: '✨'
          })
        } catch (error) {
          console.error('Error unlocking easter egg:', error)
        }
      }
      setShowFeedback('🎉')
      setClickCount(0)
    }

    // Reset feedback after 2 seconds
    setTimeout(() => {
      setShowFeedback(null)
    }, 2000)
  }

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
          <span className="text-muted-foreground/30 mx-1">•</span>
          <Link href="/uber" className="hover:text-primary transition-colors py-1 px-2 rounded-md hover:bg-secondary/50">
            Über
          </Link>
          <span className="text-muted-foreground/30 mx-1">•</span>
          <Link href="/datenschutz" className="hover:text-primary transition-colors py-1 px-2 rounded-md hover:bg-secondary/50">
            Datenschutz
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            {showFeedback && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-primary text-primary-foreground rounded-md text-[10px] font-bold animate-bounce shadow-md whitespace-nowrap z-10">
                {showFeedback === '?' ? (
                  <div className="flex items-center gap-1">
                    <span>Was guckst du?</span>
                  </div>
                ) : showFeedback}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45" />
              </div>
            )}
            <span 
              onClick={handleVersionClick}
              className={`px-2.5 py-1 rounded-full bg-secondary border border-border/50 text-[10px] font-bold tracking-wider cursor-pointer select-none transition-all ${clickCount > 0 ? 'scale-110 border-primary/50' : 'hover:bg-secondary/80'}`}
            >
              v{version}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
