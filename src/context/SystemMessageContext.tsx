'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react'
import { SystemMessage } from '@/types/systemMessages'
import { toast } from 'sonner'
import { useAuth } from './AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore'
import { DelayedAction, CustomPopupMessage, Settings } from '@/types/database'

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

const AUTH_ROUTES = ['/login', '/register', '/waiting', '/unauthorized', '/maintenance']

interface SystemMessageContextType {
  activeMessages: SystemMessage[]
  pushMessage: (msg: Omit<SystemMessage, 'id' | 'createdAt'> & { id?: string }) => string
  dismissMessage: (id: string) => void
  maintenance: Settings['maintenance'] | null
}

const SystemMessageContext = createContext<SystemMessageContextType | undefined>(undefined)

export const useSystemMessage = () => {
  const context = useContext(SystemMessageContext)
  if (!context) {
    throw new Error('useSystemMessage must be used within a SystemMessageProvider')
  }
  return context
}

export const SystemMessageProvider = ({ children }: { children: ReactNode }) => {
  const [activeMessages, setActiveMessages] = useState<SystemMessage[]>([])
  const { user, profile, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [maintenance, setMaintenance] = useState<Settings['maintenance'] | null>(null)

  // Diagnostic: Log initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('SystemMessageProvider: Mounting on client...');
    }
  }, [])

  const dismissMessage = useCallback((id: string) => {
    setActiveMessages((prev) => {
      const messageToDismiss = prev.find(m => m.id === id)
      if (messageToDismiss?.onDismiss) {
        messageToDismiss.onDismiss()
      }
      return prev.filter((m) => m.id !== id)
    })
  }, [])

  const pushMessage = useCallback((msg: Omit<SystemMessage, 'id' | 'createdAt'> & { id?: string }) => {
    const id = msg.id || (typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2, 9))

    setActiveMessages((prev) => {
      if (prev.some(m => m.id === id)) return prev
      
      const newMessage: SystemMessage = {
        ...msg,
        id,
        createdAt: new Date().toISOString(),
      }
      return [...prev, newMessage]
    })

    if (msg.type === 'toast') {
      const firstAction = msg.actions?.[0]
      const toastOptions = {
        id,
        description: msg.content,
        duration: msg.duration === 0 ? Infinity : (msg.duration || 5000),
        onDismiss: () => dismissMessage(id),
        onAutoClose: () => dismissMessage(id),
        action: firstAction ? {
          label: firstAction.label,
          onClick: () => {
            if (firstAction.onClick) firstAction.onClick()
            if (firstAction.href) window.location.href = firstAction.href
          },
        } : undefined,
      }

      if (msg.priority === 'critical' || msg.priority === 'high') {
        toast.error(msg.title, toastOptions)
      } else if (msg.priority === 'warning') {
        toast.warning(msg.title, toastOptions)
      } else {
        toast.info(msg.title, toastOptions)
      }
    }

    return id
  }, [dismissMessage])

  // --- Global Listeners (Shared) ---
  useEffect(() => {
    if (loading || typeof window === 'undefined' || !db || !(db as any).app) return
    
    // A. Global Settings (Popups & Cookies)
    const globalDocRef = doc(db, 'settings', 'global')
    const unsubGlobal = onSnapshot(globalDocRef, (docSnap) => {
      if (!docSnap.exists()) return
      const settings = docSnap.data()
      
      setMaintenance(settings.maintenance || null)
      
      const isAuthRoute = AUTH_ROUTES.includes(pathname)

      // 1. Popups
      const messages = (settings.custom_popup_messages || []) as CustomPopupMessage[]
      messages.forEach((msg) => {
        if (!msg.enabled) return
        if (isAuthRoute) return
        if (sessionStorage.getItem(`custom_popup_dismissed_${msg.id}`)) return
        
        const matches = !msg.routes || msg.routes.length === 0 || msg.routes.some(r => {
          if (r === '*') return true
          if (pathname === r) return true
          if (r.endsWith('/*')) {
            const prefix = r.slice(0, -2)
            return pathname === prefix || pathname.startsWith(prefix + '/')
          }
          return false
        })
        
        if (matches && Math.random() < (msg.chance ?? 1)) {
          pushMessage({
            id: msg.id,
            type: 'modal',
            priority: 'info',
            title: msg.title,
            content: msg.body,
            isDismissible: true,
            actions: msg.ctaLabel ? [{
              label: msg.ctaLabel,
              onClick: () => {
                if (msg.ctaUrl) window.open(msg.ctaUrl, '_blank')
                sessionStorage.setItem(`custom_popup_dismissed_${msg.id}`, 'true')
                dismissMessage(msg.id)
              }
            }] : undefined,
            onDismiss: () => sessionStorage.setItem(`custom_popup_dismissed_${msg.id}`, 'true')
          })
        }
      })

      // 2. Cookie Parody
      const firstVisitDone = localStorage.getItem('cookie_banner_first_visit_done')
      if (!firstVisitDone && !isAuthRoute) {
        const cookieMessages = settings.cookie_messages || FALLBACK_MESSAGES
        const message = cookieMessages[Math.floor(Math.random() * cookieMessages.length)]
        setTimeout(() => {
          pushMessage({
            id: 'cookie-banner-first-visit',
            type: 'modal',
            priority: 'info',
            title: 'Cookie-Einstellungen',
            content: message,
            isDismissible: false,
            actions: [
              {
                label: 'Ablehnen',
                onClick: () => {
                  localStorage.setItem('cookie_banner_first_visit_done', 'true')
                  dismissMessage('cookie-banner-first-visit')
                }
              },
              {
                label: 'Alle akzeptieren',
                onClick: () => {
                  localStorage.setItem('cookie_banner_first_visit_done', 'true')
                  dismissMessage('cookie-banner-first-visit')
                }
              }
            ]
          })
        }, 1200)
      } else if (!isAuthRoute && Math.random() < (settings.ad_banner_chance ?? settings.cookie_banner_chance ?? 0.3)) {
        const adMessages = settings.ad_messages || PARODY_AD_MESSAGES
        const message = adMessages[Math.floor(Math.random() * adMessages.length)]
        setTimeout(() => {
          pushMessage({
            id: 'cookie-parody-banner',
            type: 'banner',
            priority: 'info',
            title: 'Werbung',
            content: message,
            isDismissible: true
          })
        }, 3000)
      }
    }, (err) => console.error('SystemMessage: Global Settings Snapshot failed:', err))

    return () => unsubGlobal()
  }, [loading, pathname, pushMessage, dismissMessage])

  // --- User Specific Listeners ---
  useEffect(() => {
    if (loading || !user?.uid || typeof window === 'undefined' || !db || !(db as any).app) return

    const unsubscribers: (() => void)[] = []
    const uid = user.uid
    const userRole = profile?.role || ''

    // B. Admin Delayed Actions
    const isAdmin = ['admin_main', 'admin', 'admin_co'].includes(userRole)
    if (isAdmin) {
      try {
        const q = query(collection(db, 'delayed_actions'), where('status', '==', 'pending'))
        const unsubDelayed = onSnapshot(q, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' || change.type === 'modified') {
              const data = change.doc.data() as DelayedAction
              const dismissed = JSON.parse(localStorage.getItem('dismissed_delayed_actions') || '[]')
              if (!dismissed.includes(change.doc.id)) {
                pushMessage({
                  id: `delayed_action_${change.doc.id}`,
                  type: 'banner',
                  priority: 'critical',
                  title: 'Systemwartung geplant',
                  content: data.description,
                  isDismissible: true,
                  onDismiss: () => {
                    const current = JSON.parse(localStorage.getItem('dismissed_delayed_actions') || '[]')
                    if (!current.includes(change.doc.id)) {
                      localStorage.setItem('dismissed_delayed_actions', JSON.stringify([...current, change.doc.id]))
                    }
                  }
                })
              }
            } else if (change.type === 'removed') {
              dismissMessage(`delayed_action_${change.doc.id}`)
            }
          })
        }, (err) => console.error('SystemMessage: Delayed Actions Snapshot failed:', err))
        unsubscribers.push(unsubDelayed)
      } catch (e) { console.error('SystemMessage: Failed to setup delayed actions listener:', e) }
    }

    // C. User Specific Data (Gifts)
    try {
      const giftsRef = collection(db, 'profiles', uid, 'unseen_gifts')
      const unsubGifts = onSnapshot(giftsRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const gift = change.doc.data()
            const giftRef = doc(db, 'profiles', uid, 'unseen_gifts', change.doc.id)
            const packCount = typeof gift.packCount === 'number' ? Math.max(0, Math.floor(gift.packCount)) : 0
            const popupTitle = (typeof gift.popupTitle === 'string' && gift.popupTitle.trim().length > 0)
              ? gift.popupTitle.trim()
              : 'Neues Geschenk!'
            const popupBody = (typeof gift.popupBody === 'string' && gift.popupBody.trim().length > 0)
              ? gift.popupBody.trim()
              : 'Du hast ein Geschenk erhalten!'
            const ctaLabel = (typeof gift.ctaLabel === 'string' && gift.ctaLabel.trim().length > 0)
              ? gift.ctaLabel.trim()
              : 'Zu den Packs'
            const ctaUrl = (typeof gift.ctaUrl === 'string' && gift.ctaUrl.startsWith('/'))
              ? gift.ctaUrl
              : '/sammelkarten'
            const dismissLabel = (typeof gift.dismissLabel === 'string' && gift.dismissLabel.trim().length > 0)
              ? gift.dismissLabel.trim()
              : 'Später'
            const notificationType = gift.notificationType === 'banner' || gift.notificationType === 'quickmessage'
              ? gift.notificationType
              : 'popup'

            const senderInfo = typeof gift.createdByName === 'string' && gift.createdByName.trim().length > 0
              ? gift.createdByName.trim()
              : 'System'

            const dismissGift = async () => {
              try {
                await deleteDoc(giftRef)
              } catch (err) {
                console.error('SystemMessage: Failed to delete gift notification:', err)
              }
            }

            const baseContent = `${packCount > 0 ? `Du hast ${packCount} zusätzliche Booster-Packs erhalten. ` : ''}${popupBody}\n\n~ ${senderInfo}`.trim()

            const baseActions = [
              {
                label: ctaLabel,
                href: ctaUrl,
                variant: 'default' as const,
              },
              {
                label: dismissLabel,
                onClick: () => {
                  void dismissGift()
                },
                variant: 'ghost' as const,
              },
            ]

            const isModal = notificationType === 'popup'

            pushMessage({
              id: change.doc.id,
              type: notificationType === 'quickmessage' ? 'toast' : (isModal ? 'modal' : 'banner'),
              priority: 'high',
              title: popupTitle,
              content: baseContent,
              isDismissible: true,
              actions: isModal
                ? [
                    {
                      label: ctaLabel,
                      href: ctaUrl,
                      variant: 'default',
                    },
                    {
                      label: 'Album öffnen',
                      href: '/sammelkarten?view=album',
                      variant: 'secondary',
                    },
                    {
                      label: dismissLabel,
                      onClick: () => {
                        void dismissGift()
                      },
                      variant: 'ghost',
                    },
                  ]
                : baseActions,
              duration: notificationType === 'quickmessage' ? 7000 : undefined,
              onDismiss: () => {
                void dismissGift()
              },
            })
          } else if (change.type === 'removed') {
            dismissMessage(change.doc.id)
          }
        })
      }, (err) => console.error('SystemMessage: User Gifts Snapshot failed:', err))
      unsubscribers.push(unsubGifts)
    } catch (e) { console.error('SystemMessage: Failed to setup gifts listener:', e) }

    return () => unsubscribers.forEach(unsub => unsub())
  }, [loading, user?.uid, profile?.role, pushMessage, dismissMessage])

  // --- Pure State Logic (Lockout) ---
  useEffect(() => {
    if (loading || !profile) return
    const timeoutUntilStr = profile.timeout_until
    const timeoutReason = profile.timeout_reason
    
    if (!timeoutUntilStr) {
      dismissMessage('user-lockout')
      return
    }

    const timeoutUntil = new Date(timeoutUntilStr)
    const now = new Date()
    
    if (timeoutUntil > now) {
      pushMessage({
        id: 'user-lockout',
        type: 'modal',
        priority: 'critical',
        title: 'Konto gesperrt',
        content: timeoutReason || 'Dein Konto wurde vorübergehend gesperrt.',
        isDismissible: false,
        actions: [{
          label: 'Abmelden',
          onClick: () => signOut(auth)
        }]
      })
    } else {
      dismissMessage('user-lockout')
      if (timeoutReason && typeof window !== 'undefined' && !sessionStorage.getItem('dismissed_timeout_warning')) {
        pushMessage({
          id: 'user-warning',
          type: 'banner',
          priority: 'critical',
          title: 'Hinweis zu deiner letzten Sperre',
          content: timeoutReason,
          isDismissible: true,
          onDismiss: () => sessionStorage.setItem('dismissed_timeout_warning', 'true')
        })
      }
    }
  }, [loading, profile?.timeout_until, profile?.timeout_reason, pushMessage, dismissMessage])

  // --- Maintenance Logic ---
  useEffect(() => {
    if (loading || typeof window === 'undefined') return
    const userRole = profile?.role || ''
    const isAdmin = ['admin_main', 'admin', 'admin_co'].includes(userRole)
    
    const checkMaintenance = () => {
      if (!maintenance) return

      const now = new Date()
      const startTime = maintenance.start ? new Date(maintenance.start) : null
      const isActuallyActive = maintenance.active || (startTime && now >= startTime)

      if (isActuallyActive) {
        const isMaintenancePath = pathname === '/maintenance'
        const isLoginPath = pathname === '/login'
        const isNewsPath = pathname?.startsWith('/news/')

        if (!isAdmin && !isMaintenancePath && !isLoginPath && !isNewsPath) {
          // Use location.href to force a full reload and stop all app logic
          window.location.href = '/maintenance'
        }
      } else {
        if (pathname === '/maintenance') {
          window.location.href = '/'
        }
      }
    }

    checkMaintenance()
    const interval = setInterval(checkMaintenance, 10000)
    return () => clearInterval(interval)
  }, [loading, maintenance, profile?.role, pathname])

  const contextValue = useMemo(() => ({
    activeMessages,
    pushMessage,
    dismissMessage,
    maintenance
  }), [activeMessages, pushMessage, dismissMessage, maintenance])

  return (
    <SystemMessageContext.Provider value={contextValue}>
      {children}
    </SystemMessageContext.Provider>
  )
}
