'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Users, LayoutGrid, MessageSquare, LucideIcon } from 'lucide-react'

export type GroupsMainTab = 'mein-team' | 'alle-gruppen' | 'shared-hub'

interface GroupNavProps {
  activeTab: GroupsMainTab
  hasTeam: boolean
}

export function GroupNav({ activeTab, hasTeam }: GroupNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const tabs: { id: GroupsMainTab; label: string; icon: LucideIcon; disabled?: boolean }[] = [
    { 
      id: 'mein-team', 
      label: 'Mein Team', 
      icon: Users,
      disabled: !hasTeam
    },
    { 
      id: 'alle-gruppen', 
      label: 'Alle Gruppen', 
      icon: LayoutGrid 
    },
    { 
      id: 'shared-hub', 
      label: 'Shared Hub', 
      icon: MessageSquare 
    },
  ]

  const handleTabChange = (tabId: GroupsMainTab) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('bereich', tabId)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center p-2 bg-background/40 backdrop-blur-xl border border-primary/10 rounded-[2.5rem] w-fit mx-auto md:mx-0 shadow-2xl shadow-primary/5">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const Icon = tab.icon

        if (tab.disabled) return null

        return (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm font-black transition-all duration-500 outline-none",
              isActive 
                ? "text-primary-foreground" 
                : "text-muted-foreground/60 hover:text-primary hover:bg-primary/5"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="active-tab-groups"
                className="absolute inset-0 bg-primary rounded-full shadow-xl shadow-primary/40"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <Icon className={cn(
              "h-4 w-4 relative z-10 transition-all duration-500",
              isActive ? "scale-110 rotate-3" : "opacity-40"
            )} />
            <span className="relative z-10 uppercase tracking-widest text-[10px] md:text-[11px]">
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
