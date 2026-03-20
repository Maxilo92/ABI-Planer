'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Cookie, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const FALLBACK_MESSAGES = [
  "Diese Webseite nutzt keine Cookies. Aber hast du schon mal drüber nachgedacht, echte Cookies in der Schule zu verkaufen, um Geld für die Abikasse zu sammeln?",
  "Keine Cookies hier! Vielleicht solltet ihr stattdessen einen Kuchenverkauf organisieren? Das bringt deutlich mehr für das Budget.",
  "Wir speichern keine Daten in Cookies. Aber wir speichern die Hoffnung, dass euer Abiball legendär wird!",
  "Cookie-Banner sind nervig, deshalb haben wir keine Cookies. Wie wäre es mit einem Waffelverkauf in der großen Pause?",
  "Diese Seite ist 100% krümelfrei. Echte Cookies gibt's am Kiosk (und der Erlös geht hoffentlich in eure Kasse)!",
  "Hier gibt es keine digitalen Kekse. Aber echte Kekse mit eurem Abi-Logo wären doch eine super Finanzierungsidee, oder?",
  "0% Cookies, 100% Abi-Planung. Denkt dran: Einnahmen aus dem Verkauf von Süßigkeiten steigern euren Kontostand massiv!"
]

export function RandomCookieBanner() {
  const [show, setShow] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const lastShown = sessionStorage.getItem('cookie_banner_shown')
    if (lastShown) return

    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      let chance = 0.3
      let messages = FALLBACK_MESSAGES

      if (snapshot.exists()) {
        const data = snapshot.data()
        chance = typeof data.cookie_banner_chance === 'number' ? data.cookie_banner_chance : 0.3
        messages = Array.isArray(data.cookie_messages) && data.cookie_messages.length > 0 
          ? data.cookie_messages 
          : FALLBACK_MESSAGES
      }

      if (Math.random() < chance) {
        const randomMsg = messages[Math.floor(Math.random() * messages.length)]
        setMessage(randomMsg)

        const timer = setTimeout(() => {
          setShow(true)
          sessionStorage.setItem('cookie_banner_shown', 'true')
        }, 3000)

        return () => clearTimeout(timer)
      }
    })

    return () => unsubscribe()
  }, [])

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] md:left-auto md:max-w-md animate-in slide-in-from-bottom-8 duration-500">
      <Card className="border-primary/20 bg-card/95 backdrop-blur-sm shadow-2xl">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-4">
            <div className="mt-1 bg-primary/10 p-2 rounded-full">
              <Cookie className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  Wichtiger Hinweis
                </h4>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 -mr-2 -mt-2 opacity-70 hover:opacity-100"
                  onClick={() => setShow(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground italic">
                "{message}"
              </p>
              <div className="pt-2 flex justify-end">
                <Button 
                  size="sm" 
                  variant="default" 
                  className="text-xs font-bold px-4"
                  onClick={() => setShow(false)}
                >
                  Verstanden!
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
