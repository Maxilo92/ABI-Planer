"use client"

import * as React from "react"
import { useState } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getAvatarId } from "@/lib/avatar"
import { computeStudioCode } from "@/lib/studio-code"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"
import { Sparkles, Fingerprint, ChevronDown } from "lucide-react"
import { AbiBotAvatar } from "@/components/ui/abi-bot-avatar"
import { AnimatedNftAvatar } from "@/components/ui/animated-nft-avatar"

interface NftAvatarProps extends React.ComponentPropsWithoutRef<typeof Avatar> {
  url?: string | null
  fallback?: string
  interactive?: boolean
  isBot?: boolean
}

export function NftAvatar({ url, fallback, interactive = true, isBot, className, ...props }: NftAvatarProps) {
  const { user } = useAuth()
  const [metaOpen, setMetaOpen] = useState(false)
  const isNft = url?.startsWith('data:image/svg+xml;base64,')
  const nftId = getAvatarId(url)
  // Only show kernel-sequenz for the owner's own avatar
  const isOwnAvatar = !isBot && !!user && isNft
  const kernelCode = isOwnAvatar ? computeStudioCode(user.uid) : null

  const avatarElement = (
    <div className={cn("relative group/nft", (isBot || (interactive && isNft)) && "cursor-pointer")}>
      {isBot ? (
        <AbiBotAvatar 
          className={className} 
        />
      ) : isNft ? (
        <AnimatedNftAvatar url={url!} className={className} />
      ) : (
        <Avatar className={className} {...props}>
          <AvatarImage src={url || ''} className="object-cover" />
          <AvatarFallback className="bg-primary/10 text-primary font-bold">
            {fallback || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
      
      {/* Optional tiny indicator for NFTs or Bot when interactive */}
      {interactive && (isNft || isBot) && (
        <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5 border-2 border-background opacity-0 group-hover/nft:opacity-100 transition-opacity scale-75">
          <Sparkles className="w-3 h-3" />
        </div>
      )}
    </div>
  )

  if (!interactive || (!isNft && !isBot)) {
    return avatarElement
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {avatarElement}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-md border-2 border-border/50">
        <DialogHeader className="space-y-4">
          <div className="mx-auto bg-muted/30 p-8 rounded-2xl border border-border/50 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-50" />
            {isBot ? (
              <AbiBotAvatar size={256} className="w-48 h-48 sm:w-64 sm:h-64 rounded-xl relative z-10 transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <AnimatedNftAvatar
                url={url!}
                size={256}
                className="w-48 h-48 sm:w-64 sm:h-64 shadow-2xl rounded-xl relative z-10 transition-transform duration-500 group-hover:scale-105"
              />
            )}
          </div>
          <DialogTitle className="text-center space-y-2 pt-2">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-black uppercase tracking-widest">
                {isBot ? 'ABI Bot Neural Core' : 'Original Pixel Matrix'}
              </span>
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-center gap-2 text-muted-foreground mt-2">
              {isBot ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="font-mono text-xs font-bold text-primary tracking-widest">SYSTEM_LIVE</span>
                </div>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" />
                  <span className="font-mono text-sm tracking-widest">{nftId}</span>
                </>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="text-center text-xs text-muted-foreground leading-relaxed px-4 pb-2">
          <p>
            {isBot ? (
              'Dieses Profilbild repräsentiert den neuronalen Kern des ABI Bots. Die animierte Pixelmatrix visualisiert die Echtzeit-Rechenprozesse und die ständige Lernbereitschaft der KI.'
            ) : (
              'Dieses Profilbild ist ein einzigartiges digitales Asset. Es besteht aus einer 8x8 Pixel-Matrix, die algorithmisch aus 16 Farben generiert wurde. Kein anderer Nutzer auf dieser Plattform besitzt exakt dieselbe Pixel-Kombination.'
            )}
          </p>
        </div>

        {/* Hidden KERNEL-SEQUENZ – only for own avatar */}
        {kernelCode && (
          <div className="px-4 pb-4">
            <button
              onClick={() => setMetaOpen(o => !o)}
              className="w-full flex items-center justify-between text-[10px] font-mono text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors py-1 border-t border-border/20"
            >
              <span className="uppercase tracking-[0.2em]">Technische Metadaten</span>
              <ChevronDown className={cn('w-3 h-3 transition-transform', metaOpen && 'rotate-180')} />
            </button>
            {metaOpen && (
              <div className="mt-2 space-y-1.5 font-mono text-[10px] text-muted-foreground/50">
                <div className="flex justify-between">
                  <span className="uppercase tracking-widest">Matrix-ID</span>
                  <span>{nftId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="uppercase tracking-widest">Pixel-Dim</span>
                  <span>8 × 8 · 64 Einheiten</span>
                </div>
                <div className="flex justify-between">
                  <span className="uppercase tracking-widest">Farbraum</span>
                  <span>16-Color Palette</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-border/20 mt-1">
                  <span className="uppercase tracking-widest text-muted-foreground/30">Kernel-Sequenz</span>
                  <span className="text-muted-foreground/30 select-all tracking-wider">{kernelCode}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
