'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, ImagePlus, Loader2, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { uploadTaskImage } from '@/lib/taskMediaUpload'
import { ProtectedSystemGate } from '@/components/ui/ProtectedSystemGate'
import Image from 'next/image'
import Link from 'next/link'

export default function NewTaskPage() {
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [reward, setReward] = useState(1)
  const [complexity, setComplexity] = useState(5)
  const [images, setImages] = useState<File[]>([])
  const [loading, setLoading] = useState(false)

  if (authLoading) return null

  const isPlanner = (profile?.role === 'planner' || profile?.role === 'admin' || profile?.role === 'admin_main' || profile?.role === 'admin_co') && profile?.is_approved

  if (!isPlanner) {
    return (
      <div className="py-12">
        <ProtectedSystemGate 
          title="Keine Berechtigung" 
          description="Nur Planner und Admins können neue Aufgaben für den Marketplace erstellen."
        />
      </div>
    )
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 3) {
      toast.error('Maximal 3 Bilder erlaubt.')
      return
    }
    setImages(prev => [...prev, ...files])
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      toast.error('Bitte Titel und Beschreibung ausfüllen.')
      return
    }

    setLoading(true)
    try {
      // 1. Create task document first to get ID
      const taskRef = await addDoc(collection(db, 'tasks'), {
        title: title.trim(),
        description: description.trim(),
        reward_boosters: reward,
        complexity: complexity,
        status: 'open',
        task_image_urls: [],
        created_by: profile!.id,
        created_at: serverTimestamp(),
      })

      // 2. Upload images if any
      const imageUrls: string[] = []
      for (const file of images) {
        const { url } = await uploadTaskImage(taskRef.id, file)
        imageUrls.push(url)
      }

      // 3. Update task with image URLs
      if (imageUrls.length > 0) {
        await updateDoc(taskRef, {
          task_image_urls: imageUrls
        })
      }

      toast.success('Aufgabe erfolgreich erstellt!')
      router.push('/aufgaben')
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Fehler beim Erstellen der Aufgabe.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/aufgaben">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Neue Aufgabe</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Aufgabendetails</CardTitle>
            <CardDescription>
              Erstelle eine neue Aufgabe für den Marketplace. Beschreibe sie so genau wie möglich.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel der Aufgabe</Label>
              <Input 
                id="title" 
                placeholder="z.B. Getränke für die Abifete schleppen" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea 
                id="description" 
                placeholder="Was genau muss getan werden? Wo? Wann?" 
                className="min-h-[120px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Booster Belohnung</Label>
                  <span className="text-sm font-medium text-primary">{reward} Booster</span>
                </div>
                <Slider 
                  value={[reward]} 
                  onValueChange={(vals: number[]) => setReward(vals[0])}
                  min={1} 
                  max={20} 
                  step={1}
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Komplexität (1-10)</Label>
                  <span className="text-sm font-medium text-primary">Level {complexity}</span>
                </div>
                <Slider 
                  value={[complexity]} 
                  onValueChange={(vals: number[]) => setComplexity(vals[0])}
                  min={1} 
                  max={10} 
                  step={1}
                />
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Label>Bilder zur Erklärung (max. 3)</Label>
              <div className="grid grid-cols-3 gap-4">
                {images.map((file, index) => (
                  <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                    <Image 
                      src={URL.createObjectURL(file)} 
                      alt="Preview" 
                      fill 
                      className="object-cover"
                    />
                    <Button 
                      type="button"
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {images.length < 3 && (
                  <label className="flex flex-col items-center justify-center aspect-square rounded-md border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-colors">
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    <span className="text-[10px] mt-1 text-muted-foreground text-center px-2">Bild hinzufügen</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t pt-6">
            <Link href="/aufgaben">
              <Button variant="ghost" type="button">Abbrechen</Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Erstellt...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Aufgabe veröffentlichen
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
