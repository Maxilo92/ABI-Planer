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
  Plus
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
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
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
        <Card className="max-w-md w-full border-2">
          <CardHeader className="text-center">
            {isSubmitted ? (
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            ) : (
              <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            )}
            <CardTitle>{isSubmitted ? 'Vielen Dank!' : 'Hinweis'}</CardTitle>
            <CardDescription className="text-base mt-2">
              {isSubmitted 
                ? 'Ihre Karte wurde erfolgreich an das Team übermittelt. Wir prüfen Ihren Entwurf und melden uns, sobald die Karte im Spiel verfügbar ist.' 
                : error}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-3">
              <Button onClick={() => router.push('/login')} className="w-full font-bold uppercase tracking-wider">
                Zur Anmeldung / Login
              </Button>
              <Button onClick={() => router.push('/')} variant="outline" className="w-full">
                Zurück zur Startseite
              </Button>
            </div>
            
            <div className="pt-4 border-t text-center">
              <p className="text-xs text-muted-foreground leading-relaxed">
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
    hp: 100
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            Kartendesigner
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">Gestalte deine Karte</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {invitation ? `${shortSalutation}, willkommen im ABI Planer Team! Hier können Sie Ihre eigene Sammelkarte entwerfen.` : 'Willkommen im ABI Planer Team!'}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Form Side */}
          <div className="space-y-6">
            <Card className="shadow-lg border-2">
              <CardHeader className="bg-muted/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Karten-Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cardName" className="text-sm font-bold uppercase tracking-tight">Name der Karte</Label>
                  <Input 
                    id="cardName"
                    placeholder="Dein gewünschter Anzeigename"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rarity" className="text-sm font-bold uppercase tracking-tight">Seltenheit (Vorschlag)</Label>
                    <Select 
                      value={suggestedRarity} 
                      onValueChange={(v) => setSuggestedRarity(v as Rarity)}
                    >
                      <SelectTrigger id="rarity">
                        <SelectValue placeholder="Wähle eine Seltenheit" />
                      </SelectTrigger>
                      <SelectContent>
                        {RARITY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: opt.color }} />
                              {opt.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hp" className="text-sm font-bold uppercase tracking-tight">KP / HP (Vorschlag)</Label>
                    <Input 
                      id="hp"
                      type="number"
                      min={10}
                      max={300}
                      step={10}
                      value={suggestedHp}
                      onChange={(e) => setSuggestedHp(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desc" className="text-sm font-bold uppercase tracking-tight">Beschreibung (max. 100 Zeichen)</Label>
                  <Textarea 
                    id="desc"
                    placeholder="Ein kleiner Spruch oder Fakt über dich..."
                    maxLength={100}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="resize-none"
                  />
                  <p className="text-[10px] text-right text-muted-foreground">{description.length}/100</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold uppercase tracking-tight">Spezial-Attacken (1-3)</Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={addAttack}
                      disabled={attacks.length >= 3}
                      className="h-8 px-2 gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Angriff
                    </Button>
                  </div>
                  
                  {attacks.map((attack, idx) => (
                    <div key={idx} className="p-4 rounded-xl border-2 bg-muted/20 relative animate-in slide-in-from-top-2 duration-300">
                      {attacks.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border shadow-sm text-destructive"
                          onClick={() => removeAttack(idx)}
                        >
                          <Plus className="w-3.5 h-3.5 rotate-45" />
                        </Button>
                      )}
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Name des Angriffs"
                            value={attack.name}
                            onChange={(e) => updateAttack(idx, 'name', e.target.value)}
                            className="bg-background font-bold flex-1"
                          />
                          <div className="w-24 shrink-0">
                            <Input 
                              type="number"
                              placeholder="Dmg"
                              value={attack.damage}
                              onChange={(e) => updateAttack(idx, 'damage', parseInt(e.target.value) || 0)}
                              className="bg-background font-bold text-center"
                            />
                          </div>
                        </div>
                        <Textarea 
                          placeholder="Was macht dieser Angriff?"
                          value={attack.description}
                          onChange={(e) => updateAttack(idx, 'description', e.target.value)}
                          className="bg-background text-xs resize-none h-16"
                          maxLength={60}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-2">
              <CardHeader className="bg-muted/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  Foto (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer relative overflow-hidden group">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  {croppedImage ? (
                    <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden shadow-inner">
                      <img src={croppedImage} className="w-full h-full object-cover" alt="Vorschau" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Scissors className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-bold uppercase tracking-tight">Foto hochladen</p>
                      <p className="text-xs text-muted-foreground mt-1">4:3 Format empfohlen</p>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 text-blue-800 text-[10px] leading-relaxed dark:bg-blue-900/20 dark:text-blue-300">
                  <Info className="w-4 h-4 shrink-0" />
                  <p>Ihr Foto wird für die Erstellung Ihrer Sammelkarte im ABI Planer sowie für eine optionale physische Version der Karten verwendet. Sie können diesen Schritt auch überspringen, dann nutzen wir ein Platzhalter-Icon.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-2 bg-primary/5 border-primary/20">
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <Label className="text-sm font-black uppercase tracking-tight">Rechtliche Bestätigung</Label>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Ich bestätige die Richtigkeit meiner Angaben und besitze die Rechte an den Inhalten. 
                      Ich akzeptiere die <a href="/agb/sammelkarten" target="_blank" className="text-primary underline hover:opacity-80 font-bold">besonderen Bedingungen für Sammelkarten</a> (u.a. Rechteeinräumung, physische Reproduktion und Anpassung der Werte/Designs).
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center bg-background sm:bg-transparent p-2 rounded-lg border sm:border-0 shadow-sm sm:shadow-none">
                    <span className="text-[10px] font-bold uppercase sm:hidden">Bestätigen:</span>
                    <Switch 
                      checked={legalConfirmed}
                      onCheckedChange={setLegalConfirmed}
                    />
                  </div>
                </div>
                
                <Button 
                  className="w-full h-14 text-base font-black uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all"
                  disabled={isSubmitting || !legalConfirmed}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sende...</span>
                    </div>
                  ) : "Karte einreichen"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview Side */}
          <div className="lg:sticky lg:top-8 space-y-6 flex flex-col items-center">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Vorschau deiner Karte</h2>
            
            <Tabs defaultValue="front" className="w-full flex flex-col items-center">
              <TabsList className="w-fit mb-6">
                <TabsTrigger value="front" className="uppercase font-bold text-[10px] px-6">Vorderseite</TabsTrigger>
                <TabsTrigger value="back" className="uppercase font-bold text-[10px] px-6">Rückseite / Speccard</TabsTrigger>
              </TabsList>
              
              <TabsContent value="front" className="w-full max-w-[300px] mx-auto drop-shadow-2xl mt-0 focus-visible:outline-none">
                <TeacherCard 
                  data={previewData} 
                  interactive={false}
                  frontOnly={true}
                />
              </TabsContent>
              
              <TabsContent value="back" className="w-full max-w-[300px] mx-auto drop-shadow-2xl mt-0 focus-visible:outline-none">
                <TeacherSpecCard 
                  data={previewData}
                  styleVariant="modern-flat"
                />
              </TabsContent>
            </Tabs>

            <p className="text-[10px] text-center text-muted-foreground max-w-xs leading-relaxed">
              *Das endgültige Design (Hintergrund, Seltenheit, Werte) wird von unserem Team an das Gesamtspiel angepasst.
            </p>
          </div>
        </div>
      </div>

      {/* Cropping Dialog */}
      {isCropping && imagePreview && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-2xl aspect-[4/3] bg-muted rounded-xl overflow-hidden shadow-2xl">
            <Cropper
              image={imagePreview}
              crop={crop}
              zoom={zoom}
              aspect={4 / 3}
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
