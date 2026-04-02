import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId query parameter' }, { status: 400 })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase env vars not configured' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data, error } = await supabase
      .from('user_courses')
      .select('course_id')
      .eq('user_id', userId)
      .eq('paid', true)

    if (error) {
      console.error('[api/user-courses] supabase error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const courseIds = data?.map((item: any) => item.course_id) || []
    return NextResponse.json({ courseIds }, { status: 200 })
  } catch (err) {
    console.error('[api/user-courses]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
