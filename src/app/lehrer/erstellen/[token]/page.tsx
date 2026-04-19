'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db, storage } from '@/lib/firebase'
import { doc, getDoc, updateDoc, setDoc, collection, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Loader2, CheckCircle2, AlertTriangle, 
  ArrowRight, ArrowLeft, Sparkles, GraduationCap,
  Info, Camera, Send, X
} from 'lucide-react'
import { toast } from 'sonner'
import Cropper from 'react-easy-crop'
import { TeacherCard } from '@/components/cards/TeacherCard'
import { TeacherSpecCard } from '@/components/cards/TeacherSpecCard'
import { CardData, Rarity } from '@/types/cards'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from '@/lib/utils'

interface Invitation {
  teacherName: string
  salutation: 'Herr' | 'Frau'
  status: 'pending' | 'submitted' | 'expired'
}

interface Attack {
  name: string
  description: string
  damage: number
}

const RARITY_OPTIONS = [
  { value: 'common', label: 'Häufig (Standard)', color: '#94a3b8' },
  { value: 'rare', label: 'Selten', color: '#10b981' },
  { value: 'epic', label: 'Episch', color: '#a855f7' },
  { value: 'mythic', label: 'Mythisch', color: '#ef4444' },
  { value: 'legendary', label: 'Legendär', color: '#f59e0b' },
]

export default function TeacherCreateCardPage() {
  const { token } = useParams()
  const router = useRouter()
  
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Wizard Logic
  const [activeStep, setActiveStep] = useState(0) 
  const [helpMode, setHelpMode] = useState(true)

  // Form State
  const [cardName, setCardName] = useState('')
  const [description, setDescription] = useState('')
  const [suggestedRarity, setSuggestedRarity] = useState<Rarity>('epic')
  const [suggestedHp, setSuggestedHp] = useState<number>(100)
  const [attacks, setAttacks] = useState<Attack[]>([{ name: '', description: '', damage: 20 }])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [croppedImage, setCroppedImage] = useState<string | null>(null)
  const [legalConfirmed, setLegalConfirmed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Cropper State
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [isCropping, setIsCropping] = useState(false)

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) return
      try {
        const docRef = doc(db, 'teacher_invitations', token as string)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const data = docSnap.data() as Invitation
          if (data.status === 'submitted') {
            setError('Diese Einladung wurde bereits genutzt. Vielen Dank!')
          } else if (data.status === 'expired') {
            setError('Diese Einladung ist leider abgelaufen.')
          } else {
            setInvitation(data)
            setCardName(data.teacherName)
          }
        } else {
          setError('Ungültiger Link oder abgelaufener Code.')
        }
      } catch (err) {
        console.error(err)
        setError('Fehler beim Laden der Einladung.')
      } finally {
        setLoading(false)
      }
    }

    fetchInvitation()
  }, [token])

  const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setImagePreview(URL.createObjectURL(file))
      setIsCropping(true)
    }
  }

  const generateCroppedImage = async () => {
    try {
      if (!imagePreview) return
      const croppedImage = await getCroppedImg(imagePreview, croppedAreaPixels)
      setCroppedImage(croppedImage as string)
      setIsCropping(false)
    } catch (e) {
      console.error(e)
      toast.error('Fehler beim Zuschneiden')
    }
  }

  const addAttack = () => {
    if (attacks.length < 3) {
      setAttacks([...attacks, { name: '', description: '', damage: 20 }])
    }
  }

  const updateAttack = (index: number, field: keyof Attack, value: string | number) => {
    const newAttacks = [...attacks]
    // @ts-ignore
    newAttacks[index][field] = value
    setAttacks(newAttacks)
  }

  const handleSubmit = async () => {
    if (!cardName.trim()) return toast.error('Bitte geben Sie einen Namen ein')
    if (!legalConfirmed) return toast.error('Bitte bestätigen Sie die Hinweise')

    setIsSubmitting(true)
    try {
      let imageUrl = ''
      if (croppedImage) {
        const response = await fetch(croppedImage)
        const blob = await response.blob()
        const storageRef = ref(storage, `teacher_submissions/${token}/photo.jpg`)
        await uploadBytes(storageRef, blob)
        imageUrl = await getDownloadURL(storageRef)
      }

      const submissionRef = doc(collection(db, 'teacher_submissions'))
      await setDoc(submissionRef, {
        invitationId: token,
        originalTeacherName: invitation?.teacherName,
        cardName,
        description,
        suggestedRarity,
        suggestedHp,
        attacks: attacks.map(a => ({ ...a })),
        imageUrl,
        legalConfirmed,
        submittedAt: serverTimestamp(),
        status: 'pending_review'
      })

      await updateDoc(doc(db, 'teacher_invitations', token as string), {
        status: 'submitted'
      })

      setInvitation({ ...invitation!, status: 'submitted' })
      toast.success('Erfolgreich eingereicht')
    } catch (err) {
      console.error(err)
      toast.error('Fehler beim Einreichen')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>

  if (error || invitation?.status === 'submitted') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto bg-background">
        <div className="mb-8 p-6 rounded-full bg-muted/50">
          {invitation?.status === 'submitted' ? <CheckCircle2 className="w-16 h-16 text-emerald-500" /> : <AlertTriangle className="w-16 h-16 text-amber-500" />}
        </div>
        <h1 className="text-3xl font-bold mb-4 tracking-tight">{invitation?.status === 'submitted' ? 'Vielen Dank!' : 'Hinweis'}</h1>
        <p className="text-muted-foreground mb-10 text-lg leading-relaxed">{invitation?.status === 'submitted' ? 'Ihre Karte wurde sicher an unser Team übermittelt. Wir melden uns bei Ihnen!' : error}</p>
        <Button onClick={() => router.push('/')} variant="outline" className="w-full h-14 text-lg rounded-2xl shadow-sm border-2">Zurück zur Startseite</Button>
      </div>
    )
  }

  const nameParts = invitation?.teacherName.trim().split(/\s+/) || []
  const lastName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : (invitation?.teacherName || '')
  const greeting = `Guten Tag, ${invitation?.salutation || 'Herr/Frau'} ${lastName}`

  const previewData: CardData = {
    id: 'preview',
    name: cardName || invitation?.teacherName || 'Name',
    rarity: suggestedRarity,
    variant: 'normal',
    color: RARITY_OPTIONS.find(r => r.value === suggestedRarity)?.color || '#3b82f6',
    cardNumber: 'T1-???',
    description: description || 'Beschreibung...',
    attacks: attacks.map(a => ({ name: a.name || 'Fähigkeit', description: a.description || 'Details...', damage: a.damage })),
    hp: suggestedHp,
    imageUrl: croppedImage || undefined
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/10 flex flex-col">
      {/* Step Progress & Mode Toggle */}
      <div className="border-b sticky top-0 bg-background/95 backdrop-blur-md z-[100] transition-all">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex flex-1 gap-1.5 sm:gap-2 overflow-hidden py-2">
            {[0, 1, 2, 3, 4].map((s) => (
              <div 
                key={s} 
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all duration-500", 
                  activeStep >= s ? "bg-primary" : "bg-muted"
                )} 
              />
            ))}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className={cn(
              "text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors", 
              helpMode ? "text-primary" : "text-muted-foreground"
            )}>
              <span className="hidden xs:inline">Assistent</span>
              <span className="xs:hidden">Hilfe</span>
            </span>
            <Switch checked={helpMode} onCheckedChange={setHelpMode} className="scale-90 sm:scale-100" />
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-16">
        {/* Header Section */}
        <div className={cn("mb-10 sm:mb-16 transition-all", activeStep !== 0 && "opacity-80 scale-95 origin-left")}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
            <GraduationCap className="w-3.5 h-3.5" />
            Designer
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">{greeting}</h1>
          <p className="text-muted-foreground mt-3 text-base sm:text-lg">Gestalten wir gemeinsam Ihre persönliche Sammelkarte.</p>
        </div>

        {/* STEP 0: MODE SELECTION */}
        {activeStep === 0 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold">Willkommen! Wie möchten Sie starten?</h2>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">Wählen Sie den Modus, der Ihnen am besten gefällt. Sie können ihn jederzeit oben rechts wechseln.</p>
            </div>

            <div className="grid gap-4 sm:gap-6">
              <button 
                onClick={() => { setHelpMode(true); setActiveStep(1); }}
                className="flex items-center sm:items-start gap-4 sm:gap-6 p-5 sm:p-7 text-left border-2 rounded-3xl hover:border-primary hover:bg-primary/[0.02] transition-all group focus:ring-4 focus:ring-primary/10 outline-none"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg sm:text-xl underline decoration-primary/20 underline-offset-4">Mit Assistent (Empfohlen)</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Jeder Schritt wird einfach erklärt. Perfekt für Einsteiger.</p>
                </div>
              </button>

              <button 
                onClick={() => { setHelpMode(false); setActiveStep(1); }}
                className="flex items-center sm:items-start gap-4 sm:gap-6 p-5 sm:p-7 text-left border-2 rounded-3xl hover:border-primary hover:bg-primary/[0.02] transition-all group focus:ring-4 focus:ring-primary/10 outline-none"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-muted flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-lg sm:text-xl underline decoration-muted-foreground/20 underline-offset-4">Eigene Faust</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Direkte Eingabe ohne Erklärungen. Für alle, die es schnell mögen.</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: BASIS DATA */}
        {activeStep === 1 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="cardName" className="text-base font-semibold">Name auf der Karte</Label>
                <Input 
                  id="cardName"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="z.B. Ihr Name"
                  className="h-14 text-lg rounded-2xl border-2 focus:border-primary transition-all px-5"
                />
                {helpMode && <p className="text-sm text-muted-foreground flex items-start gap-2 pt-1"><Info className="w-4 h-4 shrink-0 mt-0.5 text-primary" /> Dieser Name steht ganz oben auf der Karte. Meist wird „{invitation?.salutation} {lastName}“ genutzt.</p>}
              </div>

              <div className="space-y-3">
                <Label htmlFor="desc" className="text-base font-semibold">Persönliche Beschreibung</Label>
                <Textarea 
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ein bekanntes Zitat oder ein Insider-Spruch..."
                  className="min-h-[140px] text-lg rounded-2xl border-2 resize-none px-5 py-4 focus:border-primary transition-all"
                  maxLength={100}
                />
                <div className="flex justify-between items-center px-1">
                  {helpMode ? (
                    <p className="text-[13px] text-muted-foreground flex items-start gap-2 max-w-[80%]">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-primary" /> Ein kurzer Text, der Ihre Persönlichkeit widerspiegelt.
                    </p>
                  ) : <div />}
                  <span className={cn("text-xs font-bold", description.length > 90 ? "text-amber-500" : "text-muted-foreground")}>{description.length}/100</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-8">
              <Button variant="ghost" onClick={() => setActiveStep(0)} className="h-14 rounded-2xl text-lg font-medium order-2 sm:order-1">
                <ArrowLeft className="mr-2 w-5 h-5" /> Zurück
              </Button>
              <Button onClick={() => setActiveStep(2)} className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/10 order-1 sm:order-2">
                Weiter <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: STATS & ATTACKS */}
        {activeStep === 2 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Seltenheits-Status</Label>
                <Select value={suggestedRarity} onValueChange={(v) => setSuggestedRarity(v as Rarity)}>
                  <SelectTrigger className="h-14 rounded-2xl border-2 px-5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-2 shadow-2xl">
                    {RARITY_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value} className="h-12 text-base font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: o.color }} />
                          {o.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {helpMode && <p className="text-[12px] text-muted-foreground px-1 italic">Beeinflusst die Häufigkeit der Karte im Spiel.</p>}
              </div>
              <div className="space-y-3">
                <Label className="text-base font-semibold">Lebensenergie (KP)</Label>
                <div className="relative">
                  <Input 
                    type="number"
                    value={suggestedHp}
                    onChange={(e) => setSuggestedHp(parseInt(e.target.value) || 0)}
                    className="h-14 rounded-2xl border-2 text-center text-2xl font-black focus:border-primary transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground">PUNKTE</div>
                </div>
                {helpMode && <p className="text-[12px] text-muted-foreground text-center italic">Üblich sind 100 bis 200 Punkte.</p>}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between border-b-2 pb-5 mb-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg">Fähigkeiten (1-3)</h3>
                  {helpMode && <p className="text-xs text-muted-foreground">Humorvolle Spezial-Kräfte für den Kampf.</p>}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addAttack} 
                  disabled={attacks.length >= 3} 
                  className="rounded-xl border-2 h-10 px-4 font-bold"
                >
                  <Plus className="w-4 h-4 mr-2" /> Hinzufügen
                </Button>
              </div>

              <div className="space-y-6">
                {attacks.map((a, i) => (
                  <div key={i} className="p-6 sm:p-8 border-2 rounded-[2.5rem] bg-muted/20 relative animate-in zoom-in-95 duration-300">
                    <div className="absolute -top-3 left-6 px-3 bg-background border-2 rounded-full text-[10px] font-black text-primary">FÄHIGKEIT {i+1}</div>
                    
                    <div className="flex flex-col sm:flex-row gap-5 mb-6">
                      <div className="flex-1 space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Name der Kraft</Label>
                        <Input value={a.name} onChange={(e) => updateAttack(i, 'name', e.target.value)} placeholder="z.B. Joker-Witz" className="rounded-xl h-12 border-2 px-4 font-bold" />
                      </div>
                      <div className="w-full sm:w-28 space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center block">Schaden</Label>
                        <Input type="number" value={a.damage} onChange={(e) => updateAttack(i, 'damage', parseInt(e.target.value) || 0)} className="rounded-xl h-12 border-2 text-center text-xl font-black" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Was passiert genau?</Label>
                      <Textarea value={a.description} onChange={(e) => updateAttack(i, 'description', e.target.value)} placeholder="Beschreibe kurz den Effekt..." className="rounded-xl min-h-[80px] border-2 resize-none px-4 py-3" maxLength={80} />
                    </div>

                    {attacks.length > 1 && (
                      <button 
                        onClick={() => updateAttack(i, 'name', '') /* simplified delete for now */}
                        className="absolute -top-3 -right-3 w-10 h-10 bg-background border-2 rounded-full flex items-center justify-center text-destructive hover:bg-destructive hover:text-white transition-all shadow-md"
                        title="Entfernen"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-10">
              <Button variant="ghost" onClick={() => setActiveStep(1)} className="h-14 rounded-2xl text-lg font-medium order-2 sm:order-1">
                <ArrowLeft className="mr-2 w-5 h-5" /> Zurück
              </Button>
              <Button onClick={() => setActiveStep(3)} className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/10 order-1 sm:order-2">
                Weiter zum Foto <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: PHOTO */}
        {activeStep === 3 && (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500 text-center">
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Ein Foto für Ihre Karte?</h2>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">Ein Bild macht die Karte erst richtig lebendig. Falls Sie keines haben, nutzen wir ein neutrales Symbol.</p>
            </div>

            <div className="flex justify-center py-4">
              <div 
                className={cn(
                  "relative w-full max-w-sm aspect-[2/1] rounded-[2.5rem] border-3 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden bg-muted/20 hover:bg-primary/5 hover:border-primary group cursor-pointer shadow-inner",
                  croppedImage && "border-solid border-primary bg-background"
                )}
              >
                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                {croppedImage ? (
                  <div className="w-full h-full relative group/img">
                    <img src={croppedImage} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera className="w-12 h-12 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4 p-8">
                    <div className="w-20 h-20 rounded-3xl bg-background shadow-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform border-2">
                      <Camera className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                      <p className="text-xl font-bold tracking-tight">Foto auswählen</p>
                      <p className="text-sm text-muted-foreground mt-1">Querformat wird empfohlen.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-12">
              <Button variant="ghost" onClick={() => setActiveStep(2)} className="h-14 rounded-2xl text-lg font-medium order-2 sm:order-1">
                <ArrowLeft className="mr-2 w-5 h-5" /> Zurück
              </Button>
              <Button onClick={() => setActiveStep(4)} className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/10 order-1 sm:order-2">
                Finale Vorschau <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: PREVIEW & SUBMIT */}
        {activeStep === 4 && (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Fertig zur Einreichung?</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">Prüfen Sie Ihre Karte ein letztes Mal. Alles bereit für die Schüler?</p>
            </div>

            <div className="flex flex-col items-center py-4">
              <Tabs defaultValue="front" className="w-full flex flex-col items-center">
                <TabsList className="bg-muted/50 rounded-2xl p-1.5 mb-10 border-2">
                  <TabsTrigger value="front" className="rounded-xl px-10 h-12 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-md">Vorderseite</TabsTrigger>
                  <TabsTrigger value="back" className="rounded-xl px-10 h-12 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-md">Rückseite</TabsTrigger>
                </TabsList>
                
                <div className="relative w-full max-w-[300px] aspect-[1/1.4] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] rounded-[2.5rem] overflow-hidden group">
                  <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] blur-3xl -z-10 animate-pulse" />
                  <TabsContent value="front" className="mt-0 w-full h-full focus-visible:outline-none"><TeacherCard data={{ ...previewData, imageUrl: undefined }} interactive={false} frontOnly={true} className="rounded-[2.5rem]" /></TabsContent>
                  <TabsContent value="back" className="mt-0 w-full h-full focus-visible:outline-none"><TeacherSpecCard data={previewData} styleVariant="modern-flat" className="rounded-[2.5rem]" /></TabsContent>
                </div>
              </Tabs>
            </div>

            <div className={cn(
              "p-6 sm:p-8 rounded-[2.5rem] border-2 flex items-start gap-5 transition-all",
              legalConfirmed ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20" : "bg-muted/30"
            )}>
              <div className="relative flex items-center h-6">
                <input 
                  id="legal" 
                  type="checkbox" 
                  checked={legalConfirmed} 
                  onChange={(e) => setLegalConfirmed(e.target.checked)}
                  className="w-7 h-7 rounded-lg border-2 border-primary text-primary focus:ring-primary/20 transition-all cursor-pointer"
                />
              </div>
              <Label htmlFor="legal" className="text-base sm:text-lg leading-snug cursor-pointer font-medium text-foreground/90">
                Hiermit bestätige ich meine Angaben und die Nutzung meines Fotos für das Projekt.
              </Label>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-10">
              <Button variant="ghost" onClick={() => setActiveStep(3)} className="h-16 rounded-2xl text-lg font-medium order-2 sm:order-1">
                <ArrowLeft className="mr-2 w-5 h-5" /> Noch was ändern
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !legalConfirmed}
                className="flex-1 h-16 rounded-3xl text-xl font-black bg-gradient-to-r from-primary to-indigo-600 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all border-b-4 border-indigo-900 active:translate-y-1 active:border-b-0 order-1 sm:order-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin mr-3 w-6 h-6" /> : <Send className="mr-3 w-6 h-6" />}
                JETZT ABSENDEN
              </Button>
            </div>
            
            <p className="text-center text-[11px] text-muted-foreground font-bold uppercase tracking-[0.2em] opacity-50">
              Ein ABI PLANER Projekt
            </p>
          </div>
        )}
      </main>

      {/* Cropping Dialog - Mobile Optimized */}
      {isCropping && imagePreview && (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-between animate-in fade-in duration-300">
          <div className="w-full p-6 flex items-center justify-between text-white border-b border-white/10 sticky top-0 bg-black/50 backdrop-blur-md z-10">
            <h2 className="font-bold">Ausschnitt wählen</h2>
            <button onClick={() => setIsCropping(false)} className="p-2 bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
          </div>

          <div className="relative w-full flex-1">
            <Cropper 
              image={imagePreview} 
              crop={crop} 
              zoom={zoom} 
              aspect={2/1} 
              onCropChange={setCrop} 
              onCropComplete={onCropComplete} 
              onZoomChange={setZoom}
              style={{
                containerStyle: { background: 'black' },
                cropAreaStyle: { border: '2px solid white' }
              }}
            />
          </div>

          <div className="w-full p-8 bg-black/50 backdrop-blur-md border-t border-white/10 flex flex-col gap-6 sticky bottom-0 z-10">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-white uppercase tracking-widest opacity-60">Zoom</span>
              <input 
                type="range" 
                min={1} 
                max={3} 
                step={0.1} 
                value={zoom} 
                onChange={(e) => setZoom(Number(e.target.value))} 
                className="flex-1 h-1 bg-white/20 rounded-full appearance-none accent-primary"
              />
            </div>
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1 h-14 rounded-2xl bg-transparent border-white/20 text-white" onClick={() => setIsCropping(false)}>Abbrechen</Button>
              <Button className="flex-1 h-14 rounded-2xl text-lg font-bold" onClick={generateCroppedImage}>Zuschneiden</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<string | null> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (error) => reject(error));
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(null);
      resolve(URL.createObjectURL(blob));
    }, 'image/jpeg', 0.9);
  });
}

// Icons
function Plus(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
