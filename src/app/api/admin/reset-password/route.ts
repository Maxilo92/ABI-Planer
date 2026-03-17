import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const { userId, newPassword } = await request.json()

  // 1. Check if requester is Admin
  const supabase = await createServerClient()
  const { data: { user: adminUser } } = await supabase.auth.getUser()
  
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', adminUser.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Use Service Role Key to update user password
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { password: newPassword }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
