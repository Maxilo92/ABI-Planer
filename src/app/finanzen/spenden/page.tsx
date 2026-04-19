'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Redirects legacy /finanzen/spenden to /finanzen/spenden/abi
 */
export default function SpendenRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/finanzen/spenden/abi')
  }, [router])

  return null
}
