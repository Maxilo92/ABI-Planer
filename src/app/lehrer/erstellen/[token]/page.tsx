'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db, storage } from '@/lib/firebase'
import { doc, getDoc, updateDoc, setDoc, collection, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Loader2, CheckCircle2, AlertTriangle, 
  Upload, Scissors, Info, Sparkles, GraduationCap,
  Plus, Sun, Moon, Accessibility
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
import { useTheme } from 'next-themes'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
  { value: 'common', label: 'Common (Häufig)', color: '#94a3b8' },
  { value: 'rare', label: 'Rare (Selten)', color: '#10b981' },
  { value: 'epic', label: 'Epic (Episch)', color: '#a855f7' },
  { value: 'mythic', label: 'Mythic (Mythisch)', color: '#ef4444' },
  { value: 'legendary', label: 'Legendary (Legendär)', color: '#f59e0b' },
]

export default function TeacherCreateCardPage() {
  const { token } = useParams()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // accessibility & theme states
  const [simplifiedMode, setSimplifiedMode] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Form State
  const [cardName, setCardName] = useState('')
  const [description, setDescription] = useState('')
  const [suggestedRarity, setSuggestedRarity] = useState<Rarity>('epic')
  const [suggestedHp, setSuggestedHp] = useState<number>(100)
  const [attacks, setAttacks] = useState<Attack[]>([{ name: '', description: '', damage: 20 }])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [croppedImage, setCroppedImage] = useState<string | null>(null)
  const [legalConfirmed, setLegalConfirmed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Cropper State
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [isCropping, setIsCropping] = useState(false)

  // Force Light Mode as default on mount
  useEffect(() => {
    setMounted(true)
    setTheme('light')
  }, [])

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
      setImageFile(file)
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
      toast.error('Fehler beim Zuschneiden des Bildes')
    }
  }

  const addAttack = () => {
    if (attacks.length < 3) {
      setAttacks([...attacks, { name: '', description: '', damage: 20 }])
    }
  }

  const removeAttack = (index: number) => {
    setAttacks(attacks.filter((_, i) => i !== index))
  }

  const updateAttack = (index: number, field: keyof Attack, value: string | number) => {
    const newAttacks = [...attacks]
    // @ts-ignore
    newAttacks[index][field] = value
    setAttacks(newAttacks)
  }

  const handleSubmit = async () => {
    if (!cardName.trim()) return toast.error('Bitte geben Sie einen Kartennamen ein')
    if (!legalConfirmed) return toast.error('Bitte bestätigen Sie die rechtlichen Hinweise')
    if (attacks.some(a => !a.name.trim())) return toast.error('Alle Angriffe benötigen einen Namen')

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
      const submissionId = submissionRef.id
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
      toast.success('Karte erfolgreich eingereicht! Vielen Dank.')
    } catch (err) {
      console.error(err)
      toast.error('Fehler beim Einreichen der Karte')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || invitation?.status === 'submitted') {
    const isSubmitted = invitation?.status === 'submitted'
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
        <Card className="max-w-md w-full border-2 rounded-[2rem] overflow-hidden shadow-2xl">
          <CardHeader className="text-center p-8">
            {isSubmitted ? (
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-6 shadow-inner">
                <AlertTriangle className="w-10 h-10" />
              </div>
            )}
            <CardTitle className="text-2xl font-black uppercase tracking-tight">{isSubmitted ? 'Vielen Dank!' : 'Hinweis'}</CardTitle>
            <CardDescription className="text-base mt-2 font-medium leading-relaxed">
              {isSubmitted 
                ? 'Ihre Karte wurde erfolgreich an das Team übermittelt. Wir prüfen Ihren Entwurf und melden uns, sobald die Karte im Spiel verfügbar ist.' 
                : error}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            <div className="flex flex-col gap-3">
              <Button onClick={() => router.push('/login')} className="w-full h-12 font-black uppercase tracking-wider rounded-xl">
                Zur Anmeldung / Login
              </Button>
              <Button onClick={() => router.push('/')} variant="outline" className="w-full h-12 font-bold rounded-xl border-2">
                Zurück zur Startseite
              </Button>
            </div>
            
            <div className="pt-6 border-t text-center">
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Bei Rückfragen wenden Sie sich bitte an:<br />
                <a 
                  href="mailto:priesnitz.maximilian@hgr-web.lernsax.de" 
                  className="font-bold text-primary hover:underline"
                >
                  priesnitz.maximilian@hgr-web.lernsax.de
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Extract last name for professional salutation
  const nameParts = invitation?.teacherName.trim().split(/\s+/) || []
  const lastName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : (invitation?.teacherName || '')
  const shortSalutation = invitation?.salutation === 'Herr' ? `Sehr geehrter Herr ${lastName}` : `Sehr geehrte Frau ${lastName}`

  // Mock CardData for preview
  const previewData: CardData = {
    id: 'preview',
    name: cardName || invitation?.teacherName || 'Dein Name',
    rarity: suggestedRarity,
    variant: 'normal',
    color: RARITY_OPTIONS.find(r => r.value === suggestedRarity)?.color || '#3b82f6',
    cardNumber: 'T1-???',
    description: description || 'Deine Beschreibung wird hier stehen...',
    attacks: attacks.map(a => ({ name: a.name || 'Angriff', description: a.description || 'Beschreibung des Angriffs...', damage: 0 })),
    hp: suggestedHp,
    imageUrl: croppedImage || undefined
  }

  // Helper for Info Toggles
  const InfoBox = ({ children, info, id }: { children: React.ReactNode, info: string, id: string }) => {
    if (simplifiedMode) {
      return (
        <div className="space-y-3">
          {children}
          <div id={id} className="p-3 rounded-xl bg-primary/5 text-primary text-[11px] leading-relaxed border border-primary/10 flex gap-2 items-start animate-in fade-in duration-300 shadow-sm">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="font-medium"><span className="font-black uppercase tracking-tight text-[9px] block mb-0.5">Erklärung:</span> {info}</p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">{children}</div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-primary/20 hover:text-primary shrink-0 transition-all border shadow-sm">
                <Info className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-4 text-xs leading-relaxed max-w-xs rounded-2xl shadow-2xl border-2" side="left">
              <p className="font-black uppercase tracking-tight text-primary mb-2 text-[10px]">Information:</p>
              <p className="font-medium">{info}</p>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 py-4 sm:py-8 px-4 sm:px-6">
      {/* Top Controls Bar */}
      <div className="max-w-5xl mx-auto mb-8 flex flex-wrap items-center justify-between gap-4 p-4 bg-background/80 backdrop-blur-md rounded-3xl border-2 shadow-sm sticky top-4 z-[60]">
        <div className="flex items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 shadow-inner">
              <Accessibility className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <Label htmlFor="simple-mode" className="text-[10px] font-black uppercase tracking-wider cursor-pointer text-muted-foreground">Erleichterte Bedienung</Label>
              <div className="flex items-center gap-2 mt-0.5">
                <Switch 
                  id="simple-mode" 
                  checked={simplifiedMode} 
                  onCheckedChange={setSimplifiedMode} 
                />
                <span className={cn("text-[10px] font-bold transition-colors", simplifiedMode ? "text-primary" : "text-muted-foreground")}>{simplifiedMode ? "AN" : "AUS"}</span>
              </div>
            </div>
          </div>

          {mounted && (
            <div className="flex items-center gap-3 border-l pl-4 sm:pl-8">
              <div className={cn("p-2 rounded-xl shadow-inner transition-colors", theme === 'dark' ? "bg-slate-800" : "bg-amber-50")}>
                {theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-amber-500" />}
              </div>
              <div className="flex flex-col">
                <Label htmlFor="theme-toggle" className="text-[10px] font-black uppercase tracking-wider cursor-pointer text-muted-foreground">Anzeige-Modus</Label>
                <div className="flex items-center gap-2 mt-0.5">
                  <Switch 
                    id="theme-toggle" 
                    checked={theme === 'dark'} 
                    onCheckedChange={(val) => setTheme(val ? 'dark' : 'light')} 
                  />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{theme === 'dark' ? "Dunkel" : "Hell"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-primary/60 uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10 shadow-inner">
          <Sparkles className="w-3.5 h-3.5" />
          Status: Entwurfs-Modus
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-10">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.2em] mb-2 shadow-sm">
            <Sparkles className="w-4 h-4" />
            Kartendesigner
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">Gestalte deine Sammelkarte</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed font-medium">
            {invitation ? `${shortSalutation}, willkommen im Team! Hier können Sie in wenigen Schritten Ihre persönliche Karte entwerfen.` : 'Willkommen im Team!'}
          </p>
          
          {simplifiedMode && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 p-6 text-left max-w-2xl mx-auto rounded-3xl mt-8 shadow-sm animate-in slide-in-from-top-4 duration-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <GraduationCap className="w-24 h-24 -rotate-12" />
              </div>
              <div className="flex gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <Info className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-black text-blue-900 text-base uppercase tracking-tight">Kurzanleitung für Einsteiger:</h3>
                  <p className="text-blue-800/80 text-sm mt-1.5 leading-relaxed font-medium">
                    Ihre Karte wird Teil eines Sammelkartenspiels für Schüler. Sie legen fest, wie Ihre Karte aussieht und welche "Kräfte" sie im Spiel hat. Keine Sorge: Unser Team prüft alle Entwürfe vor der Veröffentlichung.
                  </p>
                </div>
              </div>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Form Side */}
          <div className="space-y-8">
            <Card className="shadow-xl border-2 rounded-[2rem] overflow-hidden bg-background/50 backdrop-blur-sm transition-all hover:shadow-2xl hover:shadow-primary/5">
              <CardHeader className="bg-muted/30 border-b p-8">
                <CardTitle className="text-2xl font-black flex items-center gap-3 uppercase tracking-tight">
                  <div className="p-2 rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  Schritt 1: Karten-Details
                </CardTitle>
                <CardDescription className="text-base font-medium">Legen Sie die grundlegenden Eigenschaften Ihrer Karte fest.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-10">
                {/* Name */}
                <div className="space-y-4">
                  <Label htmlFor="cardName" className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    Name der Karte
                  </Label>
                  <Input 
                    id="cardName"
                    placeholder="z.B. Ihr Name oder ein Spitzname"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="h-14 text-xl font-bold bg-background border-2 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all"
                    aria-describedby="name-hint"
                  />
                  <p id="name-hint" className="text-sm text-muted-foreground font-medium italic pl-1">Dieser Name erscheint ganz oben auf Ihrer Karte.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {/* Rarity */}
                  <InfoBox 
                    id="rarity-hint" 
                    info='Bestimmt, wie schwer es für Schüler ist, Ihre Karte zu finden. "Legendär" ist am seltensten.'
                  >
                    <Label htmlFor="rarity" className="text-base font-black text-foreground uppercase tracking-tight">Seltenheit</Label>
                    <Select 
                      value={suggestedRarity} 
                      onValueChange={(v) => setSuggestedRarity(v as Rarity)}
                    >
                      <SelectTrigger id="rarity" className="h-14 text-lg font-bold border-2 rounded-2xl bg-background">
                        <SelectValue placeholder="Wähle eine Seltenheit" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-2 p-2">
                        {RARITY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="rounded-xl py-3 cursor-pointer">
                            <div className="flex items-center gap-3 font-bold uppercase tracking-tight text-sm">
                              <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: opt.color }} />
                              {opt.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </InfoBox>

                  {/* HP / KP */}
                  <InfoBox 
                    id="hp-hint" 
                    info='Kraftpunkte (KP) zeigen an, wie viel Ihre Karte im Duell aushält, bevor sie besiegt ist. Üblich sind 100-200.'
                  >
                    <Label htmlFor="hp" className="text-base font-black text-foreground uppercase tracking-tight">Lebensenergie (KP / HP)</Label>
                    <Input 
                      id="hp"
                      type="number"
                      min={10}
                      max={300}
                      step={10}
                      value={suggestedHp}
                      onChange={(e) => setSuggestedHp(parseInt(e.target.value) || 0)}
                      className="h-14 text-2xl font-black bg-background border-2 rounded-2xl text-center"
                    />
                  </InfoBox>
                </div>

                {/* Description */}
                <div className="space-y-4 pt-2">
                  <Label htmlFor="desc" className="text-lg font-black text-foreground uppercase tracking-tight">Kurzbeschreibung</Label>
                  <Textarea 
                    id="desc"
                    placeholder="Ein bekannter Spruch von Ihnen oder ein interessanter Fakt..."
                    maxLength={100}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="resize-none min-h-[120px] text-lg font-medium bg-background border-2 rounded-2xl p-4 leading-relaxed"
                    aria-describedby="desc-hint"
                  />
                  <div className="flex justify-between items-center px-1">
                    <p id="desc-hint" className="text-sm text-muted-foreground font-medium italic">Erscheint als kleiner Text unter dem Bild.</p>
                    <p className="text-xs font-black text-primary bg-primary/5 px-2 py-1 rounded-lg">{description.length}/100</p>
                  </div>
                </div>

                {/* Attacks */}
                <div className="space-y-6 pt-8 border-t-2 border-dashed">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-lg font-black text-foreground uppercase tracking-tight">Spezial-Attacken</Label>
                      <p className="text-sm text-muted-foreground font-medium italic">Diese Fähigkeiten nutzt Ihre Karte im Kampf.</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={addAttack}
                      disabled={attacks.length >= 3}
                      className="h-10 px-4 gap-2 border-2 border-primary/20 text-primary hover:bg-primary/5 font-black uppercase tracking-wider rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                      <Plus className="w-5 h-5" /> Angriff
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {attacks.map((attack, idx) => (
                      <div key={idx} className="p-6 rounded-[1.5rem] border-2 bg-muted/20 relative animate-in slide-in-from-right-4 duration-500 space-y-5 group transition-all hover:border-primary/20 hover:bg-background">
                        {attacks.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute -top-3 -right-3 h-10 w-10 rounded-2xl bg-white border-2 shadow-xl text-destructive hover:bg-destructive hover:text-white transition-all scale-0 group-hover:scale-100 duration-300"
                            onClick={() => removeAttack(idx)}
                            title="Angriff entfernen"
                          >
                            <Plus className="w-5 h-5 rotate-45" />
                          </Button>
                        )}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div className="sm:col-span-3 space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Name der Fähigkeit</Label>
                            <Input 
                              placeholder="z.B. Hausaufgaben-Check"
                              value={attack.name}
                              onChange={(e) => updateAttack(idx, 'name', e.target.value)}
                              className="bg-background font-black h-12 border-2 rounded-xl text-lg uppercase tracking-tight"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center block">Schaden</Label>
                            <Input 
                              type="number"
                              placeholder="Dmg"
                              value={attack.damage}
                              onChange={(e) => updateAttack(idx, 'damage', parseInt(e.target.value) || 0)}
                              className="bg-background font-black text-center h-12 border-2 rounded-xl text-xl"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Effekt-Beschreibung</Label>
                          <Textarea 
                            placeholder="Was passiert bei dieser Attacke? (z.B. 'Zieht dem Gegner 20 KP ab und verwirrt ihn.')"
                            value={attack.description}
                            onChange={(e) => updateAttack(idx, 'description', e.target.value)}
                            className="bg-background text-base font-medium resize-none h-24 border-2 rounded-xl p-3 leading-relaxed"
                            maxLength={80}
                          />
                          {simplifiedMode && (
                            <p className="text-[11px] text-right text-muted-foreground italic font-medium pt-1">Tipp: Humorvolle Texte kommen bei Schülern gut an!</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-2 rounded-[2rem] overflow-hidden bg-background/50 backdrop-blur-sm transition-all hover:shadow-2xl">
              <CardHeader className="bg-muted/30 border-b p-8">
                <CardTitle className="text-2xl font-black flex items-center gap-3 uppercase tracking-tight">
                  <div className="p-2 rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                    <Upload className="w-6 h-6" />
                  </div>
                  Schritt 2: Foto (Optional)
                </CardTitle>
                <CardDescription className="text-base font-medium">Ein Foto macht Ihre Karte erst richtig persönlich.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="flex flex-col items-center justify-center border-3 border-dashed border-muted rounded-[2rem] p-10 bg-muted/10 hover:bg-primary/5 hover:border-primary/20 transition-all cursor-pointer relative overflow-hidden group min-h-[260px] shadow-inner">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    aria-label="Foto hochladen"
                  />
                  {croppedImage ? (
                    <div className="relative w-full max-w-sm aspect-[2/1] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                      <img src={croppedImage} className="w-full h-full object-cover" alt="Vorschau Ihres Fotos" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                        <div className="bg-white p-4 rounded-3xl shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
                          <Scissors className="w-8 h-8 text-primary" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center mx-auto shadow-xl border-2 border-primary/5 transform group-hover:rotate-6 transition-transform">
                        <Upload className="w-10 h-10 text-primary" />
                      </div>
                      <div>
                        <p className="text-xl font-black text-foreground uppercase tracking-tight">Klicken zum Hochladen</p>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed font-medium">
                          Wählen Sie ein Porträtfoto aus.<br />
                          Ein breites Format (2:1) ist ideal.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {simplifiedMode && (
                  <div className="flex items-start gap-4 p-5 rounded-3xl bg-blue-50/50 text-blue-800 text-sm leading-relaxed border-2 border-blue-100/50 dark:bg-blue-900/20 dark:text-blue-200 shadow-sm">
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
                      <Info className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="font-medium pt-0.5">
                      <span className="font-black uppercase tracking-tight block mb-0.5">Hinweis:</span> Ihr Foto wird nur für diese Sammelkarte verwendet. Ohne Foto nutzen wir ein neutrales Symbol.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-2xl border-4 border-primary/20 rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background relative isolate">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl -z-10" />
              <CardHeader className="bg-primary/10 border-b-2 border-primary/10 p-8">
                <CardTitle className="text-2xl font-black flex items-center gap-3 uppercase tracking-tight text-primary">
                  <div className="p-2 rounded-2xl bg-white shadow-lg shadow-primary/10 text-primary">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  Abschluss
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="bg-white/90 dark:bg-black/40 p-6 rounded-3xl border-2 border-primary/10 shadow-lg shadow-primary/5 space-y-6 transition-all hover:border-primary/30">
                  <div className="flex items-start gap-5">
                    <div className="pt-1">
                      <Switch 
                        id="legal"
                        checked={legalConfirmed}
                        onCheckedChange={setLegalConfirmed}
                        className="scale-125 data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                    <div className="space-y-3 flex-1">
                      <Label htmlFor="legal" className="text-lg font-black leading-none cursor-pointer uppercase tracking-tight block text-foreground">
                        Ich bestätige meine Angaben
                      </Label>
                      <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium italic">
                        Mit dem Einreichen erklären Sie sich damit einverstanden, dass Ihr Name und (falls hochgeladen) Ihr Bild für die digitale und physische Version der Sammelkarte im Rahmen des ABI Planers genutzt werden dürfen.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Button 
                    className="w-full h-20 text-xl font-black uppercase tracking-[0.15em] shadow-2xl shadow-primary/30 active:scale-95 transition-all hover:shadow-primary/40 rounded-3xl bg-gradient-to-r from-primary to-indigo-600 border-b-4 border-indigo-800 hover:translate-y-[-2px]"
                    disabled={isSubmitting || !legalConfirmed}
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span>Wird übertragen...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        Fertig! Karte einreichen
                        <Sparkles className="w-5 h-6" />
                      </div>
                    )}
                  </Button>
                  
                  <p className="text-[11px] text-center text-muted-foreground font-black uppercase tracking-widest opacity-60">
                    Nach dem Absenden sind keine Änderungen mehr möglich.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Side */}
          <div className="lg:sticky lg:top-32 space-y-10 flex flex-col items-center">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest border">
                Live-Preview
              </div>
              <h2 className="text-lg font-black uppercase tracking-[0.2em] text-foreground">Ihre Vorschau</h2>
              <p className="text-sm text-muted-foreground font-medium">So wird Ihre Karte ungefähr im Spiel aussehen.</p>
            </div>
            
            <Tabs defaultValue="front" className="w-full flex flex-col items-center">
              <TabsList className="w-fit mb-10 bg-muted/50 p-1.5 border-2 rounded-2xl shadow-inner backdrop-blur-sm">
                <TabsTrigger value="front" className="uppercase font-black text-xs px-10 h-12 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all tracking-widest">
                  Vorderseite
                </TabsTrigger>
                <TabsTrigger value="back" className="uppercase font-black text-xs px-10 h-12 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all tracking-widest">
                  Details
                </TabsTrigger>
              </TabsList>
              
              <div className="relative group">
                {/* Visual Glow behind card */}
                <div className="absolute -inset-10 bg-primary/20 rounded-[4rem] blur-[80px] group-hover:bg-primary/30 transition-all duration-700 animate-pulse" />
                
                <TabsContent value="front" className="relative w-[320px] h-[450px] drop-shadow-[0_35px_35px_rgba(0,0,0,0.3)] mt-0 focus-visible:outline-none animate-in fade-in zoom-in-95 duration-700">
                  <TeacherCard 
                    data={{ ...previewData, imageUrl: undefined }} 
                    interactive={false}
                    frontOnly={true}
                    className="rounded-[2.5rem]"
                  />
                </TabsContent>
                
                <TabsContent value="back" className="relative w-[320px] h-[450px] drop-shadow-[0_35px_35px_rgba(0,0,0,0.3)] mt-0 focus-visible:outline-none animate-in fade-in zoom-in-95 duration-700">
                  <TeacherSpecCard 
                    data={previewData}
                    styleVariant="modern-flat"
                    className="rounded-[2.5rem]"
                  />
                </TabsContent>
              </div>
            </Tabs>

            <div className="max-w-xs w-full">
              {simplifiedMode && (
                <div className="p-6 rounded-[2rem] bg-amber-50/50 border-2 border-amber-100 text-amber-900 text-[11px] leading-relaxed italic animate-in fade-in duration-700 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Sparkles className="w-8 h-8 rotate-12" />
                  </div>
                  <span className="font-black block mb-2 not-italic uppercase tracking-tight text-amber-900/60">Wichtiger Hinweis:</span>
                  Die endgültige Gestaltung (Farben, Effekte und exakte Werte) wird von unserem Grafik-Team für ein stimmiges Gesamtbild optimiert.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cropping Dialog */}
      {isCropping && imagePreview && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-2xl aspect-[2/1] bg-muted rounded-xl overflow-hidden shadow-2xl">
            <Cropper
              image={imagePreview}
              crop={crop}
              zoom={zoom}
              aspect={2 / 1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div className="mt-8 flex gap-4 w-full max-w-md">
            <Button variant="outline" className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => setIsCropping(false)}>Abbrechen</Button>
            <Button className="flex-1" onClick={generateCroppedImage}>Zuschneiden</Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper to crop image
async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<string | null> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', (error) => reject(error))
    img.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')

  if (!ctx) return null

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(null)
      resolve(URL.createObjectURL(blob))
    }, 'image/jpeg', 0.9)
  })
}
