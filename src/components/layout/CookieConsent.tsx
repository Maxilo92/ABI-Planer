'use client'

import * as React from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function CookieConsent() {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const consent = localStorage.getItem('cookie-consent-accepted')
    if (consent === null) {
      setIsVisible(true)
    }
  }, [])

  const handleChoice = (accepted: boolean) => {
    localStorage.setItem('cookie-consent-accepted', String(accepted))
    setIsVisible(false)
    window.dispatchEvent(new Event('cookie-consent-changed'))
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 pointer-events-none">
      <Card className="max-w-2xl mx-auto pointer-events-auto bg-background/95 backdrop-blur-sm shadow-lg border-primary/20">
        <CardContent className="pt-6">
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            Wir nutzen Cookies für Google AdSense, um diesen Dienst für euch kostenfrei zu halten. 
            Ohne Cookies ist der Betrieb nicht finanzierbar. Bist du damit einverstanden?
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleChoice(false)}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Ablehnen
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => handleChoice(true)}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            Akzeptieren
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
