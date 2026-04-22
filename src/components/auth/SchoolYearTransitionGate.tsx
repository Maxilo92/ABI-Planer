'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { useLanguage } from '@/context/LanguageContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface SchoolYearTransitionGateProps {
  children: React.ReactNode
}

export function SchoolYearTransitionGate({ children }: SchoolYearTransitionGateProps) {
  const { profile, user } = useAuth()
  const { t } = useLanguage()
  const [currentSchoolYear, setCurrentSchoolYear] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [grade, setGrade] = useState<string>('')
  const [suffix, setSuffix] = useState<string>('')
  const [isChecked, setIsChecked] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configSnap = await getDoc(doc(db, 'settings', 'config'))
        if (configSnap.exists()) {
          const data = configSnap.data()
          if (data.current_school_year) {
            setCurrentSchoolYear(data.current_school_year)
          }
        }
      } catch (error) {
        console.error('Error fetching school year config:', error)
      }
    }
    fetchConfig()
  }, [])

  useEffect(() => {
    if (profile && currentSchoolYear !== null) {
      const needsTransition = !profile.school_year || profile.school_year < currentSchoolYear
      
      if (needsTransition) {
        // Pre-fill logic
        const isSpecial = profile.class_name === 'Lehrer' || profile.class_name === 'Eltern'
        if (isSpecial) {
          setGrade(profile.class_name || '')
          setSuffix('')
        } else {
          const match = profile.class_name?.match(/^(\d+)(.*)$/)
          if (match) {
            const num = parseInt(match[1])
            const sfx = match[2]
            
            let newNum = num
            let newSuffix = sfx
            
            if (num < 10) {
              newNum = num + 1
              newSuffix = sfx
            } else if (num === 10) {
              newNum = 11
              newSuffix = '' // force new input
            } else if (num >= 11) {
              newNum = Math.min(12, num + 1)
              newSuffix = sfx
            }
            
            setGrade(newNum.toString())
            setSuffix(newSuffix)
          }
        }
        setShowModal(true)
      }
    }
  }, [profile, currentSchoolYear])

  const handleSave = async () => {
    if (!user || !currentSchoolYear) return
    
    setIsSaving(true)
    try {
      const newClassName = `${grade}${suffix}`
      await updateDoc(doc(db, 'profiles', user.uid), {
        class_name: newClassName,
        school_year: currentSchoolYear,
        updated_at: serverTimestamp()
      })
      toast.success(t('auth.transition.success'))
      setShowModal(false)
    } catch (error) {
      console.error('Error updating school year:', error)
      toast.error('Fehler beim Speichern.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!showModal) {
    return <>{children}</>
  }

  return (
    <>
      {children}
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[425px]" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t('auth.transition.title')}</DialogTitle>
            <DialogDescription>
              {t('auth.transition.description')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="grade">{t('auth.transition.grade')}</Label>
              <Select value={grade} onValueChange={(value) => setGrade(value || '')}>
                <SelectTrigger id="grade">
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  {[5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                    <SelectItem key={g} value={g.toString()}>
                      {g}
                    </SelectItem>
                  ))}
                  <SelectItem value="Lehrer">{t('auth.register.options.teacher')}</SelectItem>
                  <SelectItem value="Eltern">{t('auth.register.options.parent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {grade !== 'Lehrer' && grade !== 'Eltern' && (
              <div className="grid gap-2">
                <Label htmlFor="suffix">{t('auth.transition.suffix')}</Label>
                <Input
                  id="suffix"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  placeholder="z.B. b, /4, L1"
                />
              </div>
            )}
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="confirm"
                checked={isChecked}
                onCheckedChange={(checked) => setIsChecked(!!checked)}
              />
              <label
                htmlFor="confirm"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t('auth.transition.checkbox')}
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              onClick={handleSave}
              disabled={!isChecked || isSaving || !grade}
              className="w-full sm:w-auto"
            >
              {isSaving ? t('auth.transition.saving') : t('auth.transition.button')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
