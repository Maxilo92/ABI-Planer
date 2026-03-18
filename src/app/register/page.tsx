'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc, collection, getDocs, limit, query, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [courses, setCourses] = useState<string[]>(['12A', '12B', '12C', '12D'])
  const [selectedCourse, setSelectedCourse] = useState('12A')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'config'))
        const configuredCourses = settingsSnap.exists() ? settingsSnap.data().courses : undefined
        if (Array.isArray(configuredCourses) && configuredCourses.length > 0) {
          const normalizedCourses = configuredCourses.filter((entry: unknown): entry is string => typeof entry === 'string' && entry.trim().length > 0)
          if (normalizedCourses.length > 0) {
            setCourses(normalizedCourses)
            setSelectedCourse(normalizedCourses[0])
          }
        }
      } catch (loadError) {
        console.error('Error loading courses:', loadError)
      }
    }

    loadCourses()
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 0. Domain validation
      if (!email.endsWith('@hgr-web.lernsax.de')) {
        throw new Error('Nur E-Mail Adressen von @hgr-web.lernsax.de sind erlaubt.')
      }

      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 2. Update display name
      await updateProfile(user, { displayName: fullName })

      // 3. Check if this is the first user ever
      const profilesRef = collection(db, 'profiles')
      const q = query(profilesRef, limit(1))
      const querySnapshot = await getDocs(q)
      const isFirstUser = querySnapshot.empty

      // 4. Create profile document in Firestore
      await setDoc(doc(db, 'profiles', user.uid), {
        full_name: fullName,
        email: email,
        role: isFirstUser ? 'admin' : 'viewer',
        planning_group: selectedCourse,
        is_approved: true, // Auto-approve for MVP
        created_at: new Date().toISOString(),
      })

      router.push('/')
    } catch (err: any) {
      setError('Registrierung fehlgeschlagen: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Registrieren</CardTitle>
          <CardDescription className="text-center">
            Erstelle einen Account, um mitzugestalten oder abzustimmen.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="fullName">Vollständiger Name</Label>
              <Input 
                id="fullName" 
                placeholder="Max Mustermann" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@beispiel.de" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course">Kurs</Label>
              <select
                id="course"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                {courses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Erstellung...' : 'Account erstellen'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Bereits einen Account?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Anmelden
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
