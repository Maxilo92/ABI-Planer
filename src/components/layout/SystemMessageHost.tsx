'use client'

import React from 'react'
import { useSystemMessage } from '@/context/SystemMessageContext'
import { BannerMessage } from '@/components/ui/system-messages/BannerMessage'
import { ModalMessage } from '@/components/ui/system-messages/ModalMessage'

export function SystemMessageHost() {
  const { activeMessages, dismissMessage } = useSystemMessage()

  const banners = activeMessages.filter((msg) => msg.type === 'banner')
  const modals = activeMessages.filter((msg) => msg.type === 'modal')

  if (banners.length === 0 && modals.length === 0) {
    return null
  }

  return (
    <>
      {/* Banners at the top - Fixed positioning with safe area handling */}
      {banners.length > 0 && (
        <div className="fixed top-0 left-0 right-0 z-[110] pt-safe px-4 pb-4 flex flex-col gap-3 pointer-events-none max-w-2xl mx-auto">
          {banners.map((banner) => (
            <div key={banner.id} className="pointer-events-auto">
              <BannerMessage 
                message={banner} 
                onClose={() => dismissMessage(banner.id)} 
              />
            </div>
          ))}
        </div>
      )}

      {/* Modals (portaled by Dialog) - Z-index is handled by Radix Dialog */}
      {modals.map((modal) => (
        <ModalMessage 
          key={modal.id} 
          message={modal} 
          onClose={() => dismissMessage(modal.id)} 
        />
      ))}
    </>
  )
}

