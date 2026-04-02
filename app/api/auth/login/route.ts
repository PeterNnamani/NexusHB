import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface LoginRequest {
  email: string
  password: string
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()

    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password' },
        { status: 400 }
      )
    }

    // Validate service role key availability
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing required Supabase env vars')
      return NextResponse.json({ error: 'Supabase service role key is not configured' }, { status: 500 })
    }

    // Create a Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Sign in user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    })

    if (authError || !authData.user) {
      console.error('Failed to sign in:', authError)
      return NextResponse.json({ error: 'Invalid email or password', details: authError }, { status: 401 })
    }

    // Get user data from public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (userError || !userData) {
      console.error('Failed to get user data:', userError)
      return NextResponse.json({ error: 'User data not found', details: userError }, { status: 404 })
    }

    // Return the user data
    const user = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      createdAt: userData.created_at,
      enrolledCourses: [],
      completedCourses: [],
      streak: 0,
    }

    return NextResponse.json({
      success: true,
      user: user
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}