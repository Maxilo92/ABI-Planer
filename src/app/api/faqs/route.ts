import { NextRequest, NextResponse } from 'next/server'
import { formatHelpFaqContext, searchHelpFaqs } from '@/lib/helpFaqs'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() || ''
  const limitParam = Number.parseInt(searchParams.get('limit') || '5', 10)
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 10) : 5

  const matches = searchHelpFaqs(query, 'de', limit)

  return NextResponse.json({
    ok: true,
    query,
    count: matches.length,
    matches,
    context: formatHelpFaqContext(matches),
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const query = typeof body?.q === 'string' ? body.q.trim() : ''
  const limit = typeof body?.limit === 'number' ? Math.min(Math.max(body.limit, 1), 10) : 5
  const matches = searchHelpFaqs(query, 'de', limit)

  return NextResponse.json({
    ok: true,
    query,
    count: matches.length,
    matches,
    context: formatHelpFaqContext(matches),
  })
}
