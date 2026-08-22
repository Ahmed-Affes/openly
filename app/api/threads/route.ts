import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { submissionId, roomId } = body as {
      submissionId: string
      roomId: string
    }

    const { data, error } = await supabase
      .from('threads')
      .insert({
        submission_id: submissionId,
        room_id: roomId,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
