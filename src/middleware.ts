import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getServerSupabaseUrl, getSupabaseAnonKey } from '@/lib/supabase/env'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isPublicPath =
    path === '/' ||
    path.startsWith('/how-it-works') ||
    path.startsWith('/listing/') ||
    path.startsWith('/admin') ||
    path.startsWith('/display') ||
    path.startsWith('/auth') ||
    path.startsWith('/banned') ||
    path.startsWith('/api') ||
    path.startsWith('/_next')

  if (isPublicPath) return NextResponse.next({ request })

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    getServerSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
