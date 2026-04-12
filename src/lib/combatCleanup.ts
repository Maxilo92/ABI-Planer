import type { User } from 'firebase/auth'
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
    throw new Error(`Combat cleanup proxy failed with status ${response.status}: ${payload}`)
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

export async function endMyOpenMatches(user: User, functions: Functions): Promise<EndMyOpenMatchesResult> {
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
      return callCleanupCallable(functions)
    }
  }

  return callCleanupCallable(functions)
}