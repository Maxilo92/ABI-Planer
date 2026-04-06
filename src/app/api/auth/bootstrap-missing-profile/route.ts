import { NextRequest, NextResponse } from 'next/server'

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

    let response = await fetch(`${getFunctionsBaseUrl()}/bootstrapMissingProfile`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: {} }),
    })

    const payload = await response.text()
    if (!response.ok) {
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
    console.error('Error proxying bootstrapMissingProfile:', error)
    return NextResponse.json({ ok: false, error: 'Proxy request failed' }, { status: 502 })
  }
}