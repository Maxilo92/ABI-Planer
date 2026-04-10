import { NextRequest, NextResponse } from 'next/server'
import { getLocalResetHttpStatus, resetSessionStatsFromServer } from '@/lib/adminSessionStatsReset'

export const runtime = 'nodejs'

function getFunctionsBaseUrl() {
  return (process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL || 'https://europe-west3-abi-planer-75319.cloudfunctions.net').replace(/\/$/, '')
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ ok: false, error: 'Missing authorization header' }, { status: 401 })
    }

    let response = await fetch(`${getFunctionsBaseUrl()}/resetSessionStatisticsHttp`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    })

    // Backward-compatible fallback when the HTTP variant is not deployed.
    if (response.status === 404) {
      response = await fetch(`${getFunctionsBaseUrl()}/resetSessionStatistics`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: {} }),
      })
    }

    const payload = await response.text()
    if (response.ok) {
      try {
        const parsed = JSON.parse(payload)
        const callableData = parsed && typeof parsed === 'object' && 'result' in parsed ? parsed.result : parsed
        return NextResponse.json({ ok: true, data: callableData }, { status: 200 })
      } catch {
        return NextResponse.json({ ok: true, data: payload }, { status: 200 })
      }
    }

    try {
      const localResult = await resetSessionStatsFromServer(authHeader)
      return NextResponse.json(
        {
          ok: true,
          data: {
            ...localResult,
            source: 'local-admin-fallback',
            fallback_reason: {
              upstream_status: response.status,
              upstream_body: payload,
            },
          },
        },
        { status: 200 }
      )
    } catch (localError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Reset failed on upstream and local fallback',
          upstreamStatus: response.status,
          upstreamBody: payload,
          localError: localError instanceof Error ? localError.message : 'Unknown local fallback error',
        },
        { status: getLocalResetHttpStatus(localError) }
      )
    }
  } catch (error) {
    console.error('Error proxying resetSessionStatisticsHttp (admin fallback route):', error)

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ ok: false, error: 'Missing authorization header' }, { status: 401 })
    }

    try {
      const localResult = await resetSessionStatsFromServer(authHeader)
      return NextResponse.json({ ok: true, data: { ...localResult, source: 'local-admin-fallback' } }, { status: 200 })
    } catch (localError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Proxy request failed and local fallback failed',
          proxyError: error instanceof Error ? error.message : 'Unknown proxy error',
          localError: localError instanceof Error ? localError.message : 'Unknown local fallback error',
        },
        { status: getLocalResetHttpStatus(localError) }
      )
    }
  }
}
