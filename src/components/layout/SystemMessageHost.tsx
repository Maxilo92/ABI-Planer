'use client'

import React from 'react'
import { useSystemMessage } from '@/context/SystemMessageContext'
import { BannerMessage } from '@/components/ui/system-messages/BannerMessage'
import { ModalMessage } from '@/components/ui/system-messages/ModalMessage'

export function SystemMessageHost() {
  const { activeMessages, activeModalMessage, dismissMessage } = useSystemMessage()

  const banners = activeMessages.filter((msg) => msg.type === 'banner')
  const activeModal = activeModalMessage

  if (banners.length === 0 && !activeModal) {
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

      {/* FIFO modal queue: render only the active modal */}
      {activeModal && (
        <ModalMessage 
          key={activeModal.id} 
          message={activeModal} 
          onClose={() => dismissMessage(activeModal.id)} 
        />
      )}
    </>
  )
}

