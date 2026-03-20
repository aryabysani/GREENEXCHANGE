import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  // Verify caller is authenticated
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get all profiles
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, stall_name')
    .order('id')

  // Get usernames from auth
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })

  const emailMap: Record<string, string> = {}
  for (const u of users) {
    emailMap[u.id] = (u.email ?? '').replace('@fest.com', '')
  }

  const result = (profiles ?? [])
    .filter(p => p.id !== user.id)
    .map(p => ({
      id: p.id,
      username: emailMap[p.id] ?? p.id.slice(0, 8),
      stall_name: p.stall_name,
    }))
    .sort((a, b) => a.username.localeCompare(b.username))

  return NextResponse.json({ data: result })
}
