import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

function getFunctionsBaseUrl() {
  return (process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL || 'https://europe-west3-abi-planer-75319.cloudfunctions.net').replace(/\/$/, '')
}

export async function POST() {
  try {
    const response = await fetch(`${getFunctionsBaseUrl()}/rebuildPublicLandingStats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const payload = await response.text()
    if (!response.ok) {
      return NextResponse.json({ ok: false, status: response.status, body: payload }, { status: 502 })
    }

    try {
      return NextResponse.json({ ok: true, data: JSON.parse(payload) }, { status: 200 })
    } catch {
      return NextResponse.json({ ok: true, data: payload }, { status: 200 })
    }
  } catch (error) {
    console.error('Error proxying public landing stats rebuild:', error)
    return NextResponse.json({ ok: false, error: 'Proxy request failed' }, { status: 502 })
  }
}
