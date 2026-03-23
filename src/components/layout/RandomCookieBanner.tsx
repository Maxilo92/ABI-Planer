'use client'

import { useState, useEffect, useRef } from 'react'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Cookie, Info } from 'lucide-react'
import { UniversalBanner } from '@/components/layout/UniversalBanner'

const FALLBACK_MESSAGES = [
  "Diese Webseite nutzt keine Cookies. Aber hast du schon mal drüber nachgedacht, echte Cookies in der Schule zu verkaufen, um Geld für die Abikasse zu sammeln?",
  "Keine Cookies hier! Vielleicht solltet ihr stattdessen einen Kuchenverkauf organisieren? Das bringt deutlich mehr für das Budget.",
  "Wir speichern keine Daten in Cookies. Aber wir speichern die Hoffnung, dass euer Abiball legendär wird!",
  "Cookie-Banner sind nervig, deshalb haben wir keine Cookies. Wie wäre es mit einem Waffelverkauf in der großen Pause?",
  "Diese Seite ist 100% krümelfrei. Echte Cookies gibt's am Kiosk (und der Erlös geht hoffentlich in eure Kasse)!",
  "Hier gibt es keine digitalen Kekse. Aber echte Kekse mit eurem Abi-Logo wären doch eine super Finanzierungsidee, oder?",
  "0% Cookies, 100% Abi-Planung. Denkt dran: Einnahmen aus dem Verkauf von Süßigkeiten steigern euren Kontostand massiv!"
]

const PARODY_AD_MESSAGES = [
  'Werbung (nicht bezahlt): 10 Minuten Team-Meeting sparen euch 2 Stunden Abi-Chaos am Ende der Woche.',
  'Abi-Tipp des Tages: Erst Budget planen, dann Motto-Glitzer kaufen. Euer Kassenwart wird es euch danken.',
  'Parodie-Anzeige: Kuchenverkauf Plus bringt +100 Sympathie und +250 EUR Klassenkasse.',
  'Sponsoring-Idee: Lokale Cafés fragen, ob sie euren Abi-Jahrgang bei Aktionen supporten.',
  'Promo-Hinweis: Eine gute Aufgabenliste ist günstiger als jede Last-Minute-Rettungsaktion.',
  'Abi-Gag mit Mehrwert: Plant den DJ früh, bevor nur noch die Schützenkapelle frei ist.',
  'Werbeblock Ende: Wenn jeder im Team eine Mini-Aufgabe übernimmt, wird der Abiball plötzlich machbar.'
]

interface GlobalBannerSettings {
  cookie_banner_chance?: number
  cookie_messages?: string[]
  ad_messages?: string[]
}

export function RandomCookieBanner() {
  const [show, setShow] = useState(false)
  const [message, setMessage] = useState('')
  const [isFirstStartQuestion, setIsFirstStartQuestion] = useState(false)
  const decisionHandledRef = useRef(false)

  const closeBanner = () => {
    if (isFirstStartQuestion) {
      localStorage.setItem('cookie_banner_first_visit_done', 'true')
      setIsFirstStartQuestion(false)
    }
    setShow(false)
  }

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (decisionHandledRef.current) return

      let chance = 0.3
      let cookieMessages = FALLBACK_MESSAGES
      let adMessages = PARODY_AD_MESSAGES

      if (snapshot.exists()) {
        const data = snapshot.data() as GlobalBannerSettings
        chance = typeof data.cookie_banner_chance === 'number' ? data.cookie_banner_chance : 0.3
        cookieMessages = Array.isArray(data.cookie_messages) && data.cookie_messages.length > 0
          ? data.cookie_messages 
          : FALLBACK_MESSAGES
        adMessages = Array.isArray(data.ad_messages) && data.ad_messages.length > 0
          ? data.ad_messages
          : PARODY_AD_MESSAGES
      }

      // Check if it is the VERY first visit (across all sessions)
      const firstVisitDone = localStorage.getItem('cookie_banner_first_visit_done')
      const isFirstVisit = !firstVisitDone

      // First app start: explicit cookie question. Afterwards: standard info banner.
      if (isFirstVisit) {
        decisionHandledRef.current = true
        setIsFirstStartQuestion(true)
        const cookieMessage = cookieMessages[Math.floor(Math.random() * cookieMessages.length)]
        setMessage(cookieMessage)

        const timer = setTimeout(() => {
          setShow(true)
        }, 1200)

        return () => clearTimeout(timer)
      }

      if (Math.random() < chance) {
        decisionHandledRef.current = true
        setIsFirstStartQuestion(false)
        const adMessage = adMessages[Math.floor(Math.random() * adMessages.length)]
        setMessage(adMessage)

        const timer = setTimeout(() => {
          setShow(true)
        }, 3000)

        return () => clearTimeout(timer)
      }
    })

    return () => unsubscribe()
  }, [])

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] md:left-auto md:max-w-md animate-in slide-in-from-bottom-8 duration-500">
      <UniversalBanner
        tone="info"
        layout="floating"
        onClose={closeBanner}
        icon={isFirstStartQuestion ? <Cookie className="h-5 w-5" /> : <Info className="h-5 w-5" />}
        title={isFirstStartQuestion ? 'Cookie-Einstellungen' : 'Werbung'}
        message={message}
        actions={
          isFirstStartQuestion ? (
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs font-medium px-4"
                onClick={closeBanner}
              >
                Ablehnen
              </Button>
              <Button
                size="sm"
                variant="default"
                className="text-xs font-bold px-4"
                onClick={closeBanner}
              >
                Alle akzeptieren
              </Button>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                className="text-xs font-medium px-4"
                onClick={closeBanner}
              >
                Alles klar
              </Button>
            </div>
          )
        }
      />
    </div>
  )
}
