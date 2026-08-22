import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Answer } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { roomId, answers, deviceHash } = body as {
      roomId: string
      answers: Omit<Answer, 'id' | 'created_at'>[]
      deviceHash: string
    }

    // Check if device already submitted
    const { data: existing } = await supabase
      .from('submissions')
      .select('id')
      .eq('room_id', roomId)
      .eq('device_hash', deviceHash)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already submitted' }, { status: 400 })
    }

    // Create submission
    const { data: submissionData, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        room_id: roomId,
        device_hash: deviceHash,
      })
      .select()
      .single()

    if (submissionError) throw submissionError

    // Insert answers
    const answersToInsert = answers.map(a => ({
      ...a,
      submission_id: submissionData.id,
    }))

    const { error: answersError } = await supabase
      .from('answers')
      .insert(answersToInsert)

    if (answersError) throw answersError

    return NextResponse.json({ success: true, submissionId: submissionData.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
