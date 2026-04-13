import type { User } from 'firebase/auth'
import { deleteDoc, doc, type Firestore } from 'firebase/firestore'
import { httpsCallable, type Functions } from 'firebase/functions'

export type EndMyOpenMatchesResult = {
  ended: number
  draws: number
}

const useLocalProxy =
  process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR !== 'true'

async function parseProxyResponse(response: Response): Promise<EndMyOpenMatchesResult> {
  const payload = await response.text()

  if (!response.ok) {
    // In dev, this is expected when production cloud functions aren't available
    const isDev = typeof window !== 'undefined' && window.location.hostname.includes('localhost')
    const logFn = isDev ? console.info : console.error
    logFn(
      `[Combat Cleanup] Proxy returned ${response.status}. This is normal in dev environments. Fallback will be used.`
    )
    throw new Error(`Combat cleanup proxy failed with status ${response.status}`)
  }

  try {
    const parsed = JSON.parse(payload)
    return (parsed?.data ?? parsed?.result ?? parsed) as EndMyOpenMatchesResult
  } catch {
    throw new Error('Combat cleanup proxy returned an invalid response body.')
  }
}

async function callCleanupCallable(functions: Functions): Promise<EndMyOpenMatchesResult> {
  const endMyOpenMatchesCallable = httpsCallable<unknown, EndMyOpenMatchesResult>(functions, 'endMyOpenMatches')
  const result = await endMyOpenMatchesCallable({})
  return result.data as EndMyOpenMatchesResult
}

async function clearLocalQueueEntry(user: User, db?: Firestore): Promise<void> {
  if (!db) return

  try {
    await deleteDoc(doc(db, 'matchmaking_queue', user.uid))
  } catch (error) {
    console.warn('Combat cleanup local queue fallback failed:', error)
  }
}

export async function endMyOpenMatches(user: User, functions: Functions, db?: Firestore): Promise<EndMyOpenMatchesResult> {
  if (useLocalProxy) {
    const idToken = await user.getIdToken()
    try {
      const response = await fetch('/api/combat/end-my-open-matches', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      })

      return parseProxyResponse(response)
    } catch (proxyError) {
      console.warn('Combat cleanup proxy failed, falling back to callable:', proxyError)
      try {
        return await callCleanupCallable(functions)
      } catch (callableError) {
        console.warn('Combat cleanup callable failed, using local queue fallback:', callableError)
        await clearLocalQueueEntry(user, db)
        return { ended: 0, draws: 0 }
      }
    }
  }

  try {
    return await callCleanupCallable(functions)
  } catch (callableError) {
    console.warn('Combat cleanup callable failed, using local queue fallback:', callableError)
    await clearLocalQueueEntry(user, db)
    return { ended: 0, draws: 0 }
  }
}