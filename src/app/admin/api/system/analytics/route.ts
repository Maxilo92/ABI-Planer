import { NextRequest, NextResponse } from 'next/server'
import { buildAnalyticsFromPastLogs } from '@/lib/adminSystemAnalytics'

export const runtime = 'nodejs'

function getFunctionsBaseUrl() {
  return (process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL || 'https://europe-west3-abi-planer-75319.cloudfunctions.net').replace(/\/$/, '')
}

function getEmptyAnalyticsPayload() {
  return {
    window_days: 7,
    generated_at: new Date().toISOString(),
    total_log_entries: 0,
    current_online_users_count: 0,
    current_online_users: [],
    activity_timeline: [],
    top_actions: [],
    section_usage: [],
    recent_actions: [],
    average_session_minutes: 0,
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ ok: false, error: 'Missing authorization header' }, { status: 401 })
    }

    let response = await fetch(`${getFunctionsBaseUrl()}/getSystemAnalyticsHttp`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    })

    // Backward-compatible fallback when the HTTP variant is not deployed.
    if (response.status === 404) {
      response = await fetch(`${getFunctionsBaseUrl()}/getSystemAnalytics`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: {} }),
      })
    }

    const payload = await response.text()
    if (!response.ok) {
      if (response.status === 404) {
        try {
          const fallbackAnalytics = await buildAnalyticsFromPastLogs(authHeader)
          return NextResponse.json({ ok: true, data: fallbackAnalytics, degraded: true, source: 'local-logs' }, { status: 200 })
        } catch {
          return NextResponse.json({ ok: true, data: getEmptyAnalyticsPayload(), degraded: true, source: 'empty-fallback' }, { status: 200 })
        }
      }
      return NextResponse.json(
        { ok: false, error: 'Upstream request failed', upstreamStatus: response.status, body: payload },
        { status: 502 }
      )
    }

    try {
      const parsed = JSON.parse(payload)
      const callableData = parsed && typeof parsed === 'object' && 'result' in parsed ? parsed.result : parsed
      return NextResponse.json({ ok: true, data: callableData }, { status: 200 })
    } catch {
      return NextResponse.json({ ok: true, data: payload }, { status: 200 })
    }
  } catch (error) {
    console.error('Error proxying getSystemAnalyticsHttp (admin fallback route):', error)
    return NextResponse.json({ ok: false, error: 'Proxy request failed' }, { status: 502 })
  }
}
