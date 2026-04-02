import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface SignupRequest {
  name: string
  email: string
  password: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json()

    // Validate required fields
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, password' },
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

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      user_metadata: {
        name: body.name,
      },
    })

    if (authError || !authData.user) {
      console.error('Failed to create auth user:', authError)
      return NextResponse.json({ error: 'Failed to create auth user', details: authError }, { status: 500 })
    }

    // Create user in public.users table with the same ID as auth user
    const { error: userError } = await supabase.from('users').insert({
      id: authData.user.id,
      name: body.name,
      email: body.email,
      created_at: new Date().toISOString(),
    })

    if (userError) {
      console.error('Failed to create user:', userError)
      // Try to delete the auth user if public user creation failed
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: 'Failed to create user', details: userError }, { status: 500 })
    }

    // Return the created user data
    const user = {
      id: authData.user.id,
      name: body.name,
      email: body.email,
      createdAt: new Date().toISOString(),
      enrolledCourses: [],
      completedCourses: [],
      streak: 0,
    }

    return NextResponse.json({
      success: true,
      user: user
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}