'use client'

import React, { useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { PrintableTeacherCard } from '@/components/cards/PrintableTeacherCard'
import { db } from '@/lib/firebase'
import { getMainBaseUrl } from '@/lib/dashboard-url'
import { CardData } from '@/types/cards'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { ArrowRight, CheckCircle2, Loader2, Upload } from 'lucide-react'

type FormData = {
  title: string
  firstName: string
  lastName: string
  subjects: string
  quote: string
  punctuality: string
  difficulty: number
  funFact: string
  unpopularSubject: string
  leisure: string
  imageUrl: string
}

type FormErrors = {
  firstName?: string
  lastName?: string
  subjects?: string
  quote?: string
  punctuality?: string
  funFact?: string
  unpopularSubject?: string
  leisure?: string
  imageUrl?: string
  legal?: string
  general?: string
}

const TERMS_VERSION = '2026-04-25'

const initialData: FormData = {
  title: 'Herr',
  firstName: '',
  lastName: '',
  subjects: '',
  quote: '',
  punctuality: 'Pünktlich',
  difficulty: 5,
  funFact: '',
  unpopularSubject: '',
  leisure: '',
  imageUrl: '',
}

const compressImageIterative = async (base64Str: string, targetSizeChars = 600000): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!base64Str.startsWith('data:image')) {
      resolve(base64Str)
      return
    }

    const img = new window.Image()
    img.src = base64Str
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      let currentQuality = 0.8
      let currentWidth = Math.min(img.width, 1000)
      let currentHeight = (img.height * currentWidth) / img.width
      let result = base64Str
      let iterations = 0

      while (result.length > targetSizeChars && iterations < 5) {
        canvas.width = currentWidth
        canvas.height = currentHeight
        ctx?.clearRect(0, 0, currentWidth, currentHeight)
        ctx?.drawImage(img, 0, 0, currentWidth, currentHeight)
        result = canvas.toDataURL('image/webp', currentQuality)
        currentQuality -= 0.15
        currentWidth *= 0.8
        currentHeight *= 0.8
        iterations += 1
      }

      resolve(result)
    }

    img.onerror = reject
  })
}

export default function LehrerAnmeldungPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [optimizationStatus, setOptimizationStatus] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formData, setFormData] = useState<FormData>(initialData)
  const [consents, setConsents] = useState({
    photoAndProfileConsent: false,
    termsAccepted: false,
    privacyAccepted: false,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const randomId = useMemo(() => Math.floor(100 + Math.random() * 900).toString(), [])
  const mainBaseUrl = getMainBaseUrl()

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }))
    }
  }

  const updateConsent = (key: keyof typeof consents, checked: boolean) => {
    setConsents((prev) => ({ ...prev, [key]: checked }))
    if (errors.legal) {
      setErrors((prev) => ({ ...prev, legal: undefined, general: undefined }))
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, imageUrl: 'Bitte lade eine gültige Bilddatei hoch.' }))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, imageUrl: 'Das Bild ist zu groß. Maximal sind 5 MB erlaubt.' }))
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result === 'string') {
        updateField('imageUrl', result)
      }
    }
    reader.readAsDataURL(file)
  }

  const validateStepOne = () => {
    const nextErrors: FormErrors = {}

    if (!formData.firstName.trim()) {
      nextErrors.firstName = 'Bitte gib den Vornamen an.'
    }
    if (!formData.lastName.trim()) {
      nextErrors.lastName = 'Bitte gib den Nachnamen an.'
    }
    if (!formData.subjects.trim()) {
      nextErrors.subjects = 'Bitte gib die Unterrichtsfächer an.'
    }
    if (!formData.quote.trim()) {
      nextErrors.quote = 'Bitte gib einen Wahlspruch an.'
    }
    if (!formData.punctuality.trim()) {
      nextErrors.punctuality = 'Bitte gib die Pünktlichkeit an.'
    }
    if (!formData.funFact.trim()) {
      nextErrors.funFact = 'Bitte gib einen Fun Fact an.'
    }
    if (!formData.unpopularSubject.trim()) {
      nextErrors.unpopularSubject = 'Bitte gib das unbeliebteste Fach an.'
    }
    if (!formData.leisure.trim()) {
      nextErrors.leisure = 'Bitte gib ein Hobby an.'
    }
    if (!formData.imageUrl) {
      nextErrors.imageUrl = 'Bitte lade ein Foto hoch.'
    }

    setErrors((prev) => ({ ...prev, ...nextErrors, general: undefined }))
    return Object.keys(nextErrors).length === 0
  }

  const validateStepTwo = () => {
    if (!consents.photoAndProfileConsent || !consents.termsAccepted || !consents.privacyAccepted) {
      setErrors((prev) => ({
        ...prev,
        legal: 'Bitte bestätige alle verpflichtenden Einwilligungen, bevor du absendest.',
      }))
      return false
    }

    setErrors((prev) => ({ ...prev, legal: undefined, general: undefined }))
    return true
  }

  const goToReview = () => {
    if (!validateStepOne()) return
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setStep(1)
    setErrors({})
    setSuccess(false)
    setOptimizationStatus(null)
    setConsents({
      photoAndProfileConsent: false,
      termsAccepted: false,
      privacyAccepted: false,
    })
    setFormData(initialData)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!validateStepOne()) {
      setStep(1)
      return
    }

    if (!validateStepTwo()) {
      setStep(2)
      return
    }

    setLoading(true)

    try {
      let currentImageUrl = formData.imageUrl
      if (currentImageUrl.length > 700000) {
        setOptimizationStatus('Bild wird optimiert...')
        currentImageUrl = await compressImageIterative(currentImageUrl)
      }

      await addDoc(collection(db, 'teacher_card_drafts'), {
        ...formData,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        subjects: formData.subjects.trim(),
        quote: formData.quote.trim(),
        punctuality: formData.punctuality.trim(),
        funFact: formData.funFact.trim(),
        unpopularSubject: formData.unpopularSubject.trim(),
        leisure: formData.leisure.trim(),
        imageUrl: currentImageUrl,
        legal_consents: {
          photo_and_profile_consent: true,
          terms_accepted: true,
          privacy_accepted: true,
          terms_version: TERMS_VERSION,
          accepted_at: new Date().toISOString(),
        },
        legal_consents_recorded: true,
        status: 'pending',
        created_at: serverTimestamp(),
        type: 'teacher_registration',
      })

      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      console.error('Error submitting form:', error)
      setErrors((prev) => ({
        ...prev,
        general: 'Beim Absenden ist ein Fehler aufgetreten. Bitte versuche es erneut.',
      }))
    } finally {
      setLoading(false)
      setOptimizationStatus(null)
    }
  }

  const previewCardData: CardData = {
    id: 'preview',
    cardNumber: randomId,
    name: `${formData.title} ${formData.lastName}`.trim() || 'Name des Lehrers',
    rarity: 'common',
    variant: 'normal',
    color: '#3b82f6',
    imageUrl: formData.imageUrl,
  }

  const previewDetails = {
    title: formData.title,
    firstName: formData.firstName || 'Vorname',
    lastName: formData.lastName || 'Nachname',
    subjects: formData.subjects
      ? formData.subjects.split(',').map((s) => s.trim()).filter((s) => s !== '')
      : ['Fächer'],
    quote: formData.quote || 'Ihr Wahlspruch',
    stats: {
      punctuality: formData.punctuality || 'Pünktlich',
      difficulty: formData.difficulty,
      funFact: formData.funFact || 'Fun Fact',
      unpopularSubject: formData.unpopularSubject || 'Unbeliebtestes Fach',
      leisure: formData.leisure || 'Freizeit',
    },
  }

  if (success) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-20">
        <Card className="w-full max-w-md border-stone-200 shadow-sm">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto size-12 rounded-full bg-emerald-100 text-emerald-700 grid place-content-center">
              <CheckCircle2 className="size-6" />
            </div>
            <CardTitle className="text-2xl">Vielen Dank!</CardTitle>
            <CardDescription>
              Deine Anmeldung wurde gespeichert und wird jetzt vom Team geprüft.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={resetForm} className="w-full">
              Neue Anmeldung starten
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <header className="mb-8 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Lehrer-Anmeldung</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900">Sammelkarte einreichen</h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-stone-600">
            Minimal, schnell und sicher: erst Daten ausfüllen, dann prüfen und mit Einwilligung absenden.
          </p>
        </header>

        <div className="mb-8 grid grid-cols-2 gap-2 rounded-xl border border-stone-200 bg-white p-2 text-xs font-medium text-stone-600">
          <div className={`rounded-lg px-3 py-2 text-center ${step === 1 ? 'bg-stone-900 text-white' : 'bg-stone-100'}`}>
            Schritt 1: Daten
          </div>
          <div className={`rounded-lg px-3 py-2 text-center ${step === 2 ? 'bg-stone-900 text-white' : 'bg-stone-100'}`}>
            Schritt 2: Prüfen
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border-stone-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">{step === 1 ? 'Profil-Daten' : 'Review & Einwilligung'}</CardTitle>
                <CardDescription>
                  {step === 1
                    ? 'Alle Felder sind verpflichtend.'
                    : 'Bitte prüfe deine Angaben und bestätige die Einwilligungen.'}
                </CardDescription>
              </CardHeader>

              {step === 1 ? (
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-[130px_1fr]">
                    <div className="space-y-2">
                      <Label htmlFor="title">Anrede</Label>
                      <Select value={formData.title} onValueChange={(v) => updateField('title', v as string)}>
                        <SelectTrigger id="title">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['Herr', 'Frau', 'Dr.', 'Prof.'].map((title) => (
                            <SelectItem key={title} value={title}>
                              {title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Vorname</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => updateField('firstName', e.target.value)}
                          placeholder="Vorname"
                          aria-invalid={Boolean(errors.firstName)}
                        />
                        {errors.firstName ? <p className="text-xs text-red-600">{errors.firstName}</p> : null}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nachname</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => updateField('lastName', e.target.value)}
                          placeholder="Nachname"
                          aria-invalid={Boolean(errors.lastName)}
                        />
                        {errors.lastName ? <p className="text-xs text-red-600">{errors.lastName}</p> : null}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subjects">Unterrichtsfächer</Label>
                    <Input
                      id="subjects"
                      value={formData.subjects}
                      onChange={(e) => updateField('subjects', e.target.value)}
                      placeholder="z.B. Mathematik, Physik"
                      aria-invalid={Boolean(errors.subjects)}
                    />
                    {errors.subjects ? <p className="text-xs text-red-600">{errors.subjects}</p> : null}
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="quote">Wahlspruch</Label>
                      <Textarea
                        id="quote"
                        value={formData.quote}
                        onChange={(e) => updateField('quote', e.target.value)}
                        placeholder="z.B. Lernen mit Haltung"
                        className="min-h-24"
                        aria-invalid={Boolean(errors.quote)}
                      />
                      {errors.quote ? <p className="text-xs text-red-600">{errors.quote}</p> : null}
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="punctuality">Pünktlichkeit</Label>
                        <Input
                          id="punctuality"
                          value={formData.punctuality}
                          onChange={(e) => updateField('punctuality', e.target.value)}
                          placeholder="z.B. Immer pünktlich"
                          aria-invalid={Boolean(errors.punctuality)}
                        />
                        {errors.punctuality ? <p className="text-xs text-red-600">{errors.punctuality}</p> : null}
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <Label htmlFor="difficulty">Schwierigkeit</Label>
                          <span className="font-semibold text-stone-700">{formData.difficulty}/10</span>
                        </div>
                        <Slider
                          id="difficulty"
                          value={[formData.difficulty]}
                          onValueChange={([value]) => updateField('difficulty', value)}
                          max={10}
                          min={1}
                          step={1}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="funFact">Fun Fact</Label>
                      <Input
                        id="funFact"
                        value={formData.funFact}
                        onChange={(e) => updateField('funFact', e.target.value)}
                        placeholder="z.B. Ich sammle alte Landkarten"
                        aria-invalid={Boolean(errors.funFact)}
                      />
                      {errors.funFact ? <p className="text-xs text-red-600">{errors.funFact}</p> : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unpopularSubject">Unbeliebtestes Fach früher</Label>
                      <Input
                        id="unpopularSubject"
                        value={formData.unpopularSubject}
                        onChange={(e) => updateField('unpopularSubject', e.target.value)}
                        placeholder="z.B. Chemie"
                        aria-invalid={Boolean(errors.unpopularSubject)}
                      />
                      {errors.unpopularSubject ? <p className="text-xs text-red-600">{errors.unpopularSubject}</p> : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leisure">Lieblings-Hobby</Label>
                    <Input
                      id="leisure"
                      value={formData.leisure}
                      onChange={(e) => updateField('leisure', e.target.value)}
                      placeholder="z.B. Wandern"
                      aria-invalid={Boolean(errors.leisure)}
                    />
                    {errors.leisure ? <p className="text-xs text-red-600">{errors.leisure}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <Label>Foto</Label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    {formData.imageUrl ? (
                      <div className="rounded-xl border border-stone-200 bg-white p-3">
                        <div className="mx-auto max-w-44 overflow-hidden rounded-lg border border-stone-200">
                          <img src={formData.imageUrl} alt="Lehrerfoto Vorschau" className="h-full w-full object-cover" />
                        </div>
                        <div className="mt-3 flex justify-center">
                          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                            Foto ändern
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-white text-stone-600 hover:border-stone-400"
                      >
                        <Upload className="size-5" />
                        <span className="text-sm font-medium">Foto hochladen (JPG/PNG, max. 5 MB)</span>
                      </button>
                    )}
                    {errors.imageUrl ? <p className="text-xs text-red-600">{errors.imageUrl}</p> : null}
                  </div>
                </CardContent>
              ) : (
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
                    Bitte prüfe die Live-Vorschau rechts und bestätige anschließend die rechtlichen Einwilligungen.
                  </div>

                  <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
                    <div className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-3">
                      <Checkbox
                        id="photo-consent"
                        checked={consents.photoAndProfileConsent}
                        onCheckedChange={(value) => updateConsent('photoAndProfileConsent', value === true)}
                      />
                      <Label htmlFor="photo-consent" className="cursor-pointer text-sm font-normal leading-relaxed">
                        Ich willige ein, dass mein Foto und meine Profildaten für die Lehrerkarte verarbeitet und gespeichert werden.
                      </Label>
                    </div>

                    <div className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-3">
                      <Checkbox
                        id="terms-consent"
                        checked={consents.termsAccepted}
                        onCheckedChange={(value) => updateConsent('termsAccepted', value === true)}
                      />
                      <Label htmlFor="terms-consent" className="cursor-pointer text-sm font-normal leading-relaxed">
                        Ich akzeptiere die{' '}
                        <a
                          href={`${mainBaseUrl}/legal/agb`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-stone-400 underline-offset-4 hover:text-stone-900"
                        >
                          AGB
                        </a>
                        .
                      </Label>
                    </div>

                    <div className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-3">
                      <Checkbox
                        id="privacy-consent"
                        checked={consents.privacyAccepted}
                        onCheckedChange={(value) => updateConsent('privacyAccepted', value === true)}
                      />
                      <Label htmlFor="privacy-consent" className="cursor-pointer text-sm font-normal leading-relaxed">
                        Ich habe die{' '}
                        <a
                          href={`${mainBaseUrl}/legal/datenschutz`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-stone-400 underline-offset-4 hover:text-stone-900"
                        >
                          Datenschutzerklärung
                        </a>
                        {' '}gelesen und stimme zu.
                      </Label>
                    </div>
                  </div>

                  {errors.legal ? <p className="text-xs text-red-600">{errors.legal}</p> : null}
                </CardContent>
              )}
            </Card>

            {errors.general ? <p className="text-sm text-red-600">{errors.general}</p> : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" onClick={() => (step === 1 ? resetForm() : setStep(1))}>
                {step === 1 ? 'Zurücksetzen' : 'Zurück zu Schritt 1'}
              </Button>

              {step === 1 ? (
                <Button type="button" onClick={goToReview}>
                  Weiter zu Schritt 2
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Wird gesendet...
                    </>
                  ) : (
                    'Anmeldung absenden'
                  )}
                </Button>
              )}
            </div>

            {optimizationStatus ? <p className="text-xs text-stone-500">{optimizationStatus}</p> : null}
          </form>

          <aside className="lg:sticky lg:top-20">
            <Card className="border-stone-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Live-Vorschau</CardTitle>
                <CardDescription>Klick auf die Karte, um Vorder- und Rückseite zu prüfen.</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pb-8">
                <div className="origin-top scale-95 sm:scale-100">
                  <PrintableTeacherCard data={previewCardData} details={previewDetails} className="shadow-md" />
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
