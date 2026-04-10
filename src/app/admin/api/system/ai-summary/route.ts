import { NextRequest } from 'next/server'
import { handleAdminSystemAISummary } from '@/lib/adminAiSummary'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  return handleAdminSystemAISummary(request)
}
