import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Room, Question } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { room, questions } = body as { room: Partial<Room>; questions: Omit<Question, 'id' | 'created_at'>[] }

    // Create room
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .insert({
        ...room,
        creator_id: user.id,
      })
      .select()
      .single()

    if (roomError) throw roomError

    // Insert questions
    const questionsToInsert = questions.map(q => ({
      ...q,
      room_id: roomData.id,
    }))

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToInsert)

    if (questionsError) throw questionsError

    return NextResponse.json({ ...roomData, questions: questionsToInsert })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
