import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is the room creator
    const { data: room } = await supabase
      .from('rooms')
      .select('creator_id')
      .eq('id', params.roomId)
      .single()

    if (!room || room.creator_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: submissions, error } = await supabase
      .from('submissions')
      .select(`
        *,
        answers (*)
      `)
      .eq('room_id', params.roomId)

    if (error) throw error

    // Remove device_hash and shuffle for privacy
    const sanitized = (submissions || []).map((s: any) => ({
      ...s,
      device_hash: '',
      answers: (s.answers || []).map((a: any) => ({ ...a })),
    }))

    // Shuffle array
    const shuffled = [...sanitized].sort(() => Math.random() - 0.5)

    return NextResponse.json(shuffled)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
