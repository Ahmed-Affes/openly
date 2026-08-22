import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { VoteType } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { submissionId, roomId, voteType, deviceHash } = body as {
      submissionId: string
      roomId: string
      voteType: VoteType
      deviceHash: string
    }

    // Check if device already voted
    const { data: existing } = await supabase
      .from('votes')
      .select('id')
      .eq('submission_id', submissionId)
      .eq('device_hash', deviceHash)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already voted' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('votes')
      .insert({
        submission_id: submissionId,
        room_id: roomId,
        device_hash: deviceHash,
        vote_type: voteType,
      })
      .select()
      .single()

    if (error) throw error

    // Don't expose device_hash
    const { device_hash, ...voteData } = data

    return NextResponse.json(voteData)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
