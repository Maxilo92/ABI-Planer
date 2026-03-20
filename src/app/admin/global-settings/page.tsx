'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, Save, RotateCcw, Cookie } from 'lucide-react'
import { logAction } from '@/lib/logging'

interface GlobalSettings {
  cookie_banner_chance: number
  cookie_messages: string[]
}

const DEFAULT_SETTINGS: GlobalSettings = {
  cookie_banner_chance: 0.3,
  cookie_messages: [
    "Diese Webseite nutzt keine Cookies. Aber hast du schon mal drüber nachgedacht, echte Cookies in der Schule zu verkaufen, um Geld für die Abikasse zu sammeln?",
    "Keine Cookies hier! Vielleicht solltet ihr stattdessen einen Kuchenverkauf organisieren? Das bringt deutlich mehr für das Budget.",
    "Wir speichern keine Daten in Cookies. Aber wir speichern die Hoffnung, dass euer Abiball legendär wird!",
    "Cookie-Banner sind nervig, deshalb haben wir keine Cookies. Wie wäre es mit einem Waffelverkauf in der großen Pause?",
    "Diese Seite ist 100% krümelfrei. Echte Cookies gibt's am Kiosk (und der Erlös geht hoffentlich in eure Kasse)!",
    "Hier gibt es keine digitalen Kekse. Aber echte Kekse mit eurem Abi-Logo wären doch eine super Finanzierungsidee, oder?",
    "0% Cookies, 100% Abi-Planung. Denkt dran: Einnahmen aus dem Verkauf von Süßigkeiten steigern euren Kontostand massiv!"
  ]
}

export default function GlobalSettingsPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const router = useRouter()

  const isAdmin = profile?.role === 'admin_main' || profile?.role === 'admin_co' || profile?.role === 'admin'

  useEffect(() => {
    if (!authLoading && (!profile || !isAdmin)) {
      router.push('/')
      return
    }

    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as GlobalSettings)
      } else {
        setSettings(DEFAULT_SETTINGS)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [profile, authLoading, isAdmin, router])

  const handleSave = async () => {
    if (!user || !isAdmin) return
    setSaving(true)

    try {
      await setDoc(doc(db, 'settings', 'global'), settings)
      await logAction('GLOBAL_SETTINGS_UPDATED', user.uid, profile?.full_name, { settings })
      toast.success('Einstellungen erfolgreich gespeichert.')
    } catch (error) {
      console.error('Error saving global settings:', error)
      toast.error('Fehler beim Speichern der Einstellungen.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddMessage = () => {
    if (!newMessage.trim()) return
    setSettings(prev => ({
      ...prev,
      cookie_messages: [...prev.cookie_messages, newMessage.trim()]
    }))
    setNewMessage('')
  }

  const handleRemoveMessage = (index: number) => {
    setSettings(prev => ({
      ...prev,
      cookie_messages: prev.cookie_messages.filter((_, i) => i !== index)
    }))
  }

  const handleResetToDefault = () => {
    if (confirm('Möchtest du wirklich alle Einstellungen auf die Standardwerte zurücksetzen?')) {
      setSettings(DEFAULT_SETTINGS)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Globale Einstellungen</h1>
          <p className="text-muted-foreground">Verwalte systemweite Parameter und Texte.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetToDefault} disabled={saving}>
            <RotateCcw className="mr-2 h-4 w-4" /> Zurücksetzen
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Speichern
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-primary" />
              Cookie-Banner Einstellungen
            </CardTitle>
            <CardDescription>
              Hier kannst du steuern, wie oft und mit welchen Nachrichten der Cookie-Banner erscheint.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="chance">Erscheinungswahrscheinlichkeit (0.0 bis 1.0)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="chance"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.cookie_banner_chance}
                  onChange={(e) => setSettings(prev => ({ ...prev, cookie_banner_chance: parseFloat(e.target.value) }))}
                  className="max-w-[200px]"
                />
                <span className="text-sm text-muted-foreground">
                  Aktuell: {(settings.cookie_banner_chance * 100).toFixed(0)}% Chance pro Sitzung.
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Cookie-Nachrichten</Label>
              <div className="space-y-3">
                {settings.cookie_messages.map((msg, index) => (
                  <div key={index} className="flex gap-2">
                    <Textarea
                      value={msg}
                      onChange={(e) => {
                        const newMsgs = [...settings.cookie_messages]
                        newMsgs[index] = e.target.value
                        setSettings(prev => ({ ...prev, cookie_messages: newMsgs }))
                      }}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => handleRemoveMessage(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Textarea
                  placeholder="Neue Nachricht hinzufügen..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddMessage} disabled={!newMessage.trim()} className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" /> Hinzufügen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
