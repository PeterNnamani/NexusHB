import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId query parameter' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('enrollments')
      .select('course_id, status, progress')
      .eq('user_id', userId)
      .in('status', ['active', 'completed'])

    if (error) {
      console.error('[api/user-courses] supabase error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const courseIds = (data || []).map((item) => item.course_id)
    const courses = data || []
    return NextResponse.json({ courseIds, courses }, { status: 200 })
  } catch (err) {
    console.error('[api/user-courses]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
