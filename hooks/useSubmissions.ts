'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Submission, Answer, SubmissionWithAnswers } from '@/types'
import { getDeviceHash, hasSubmitted, markAsSubmitted } from '@/lib/utils/fingerprint'
import { shuffleArray } from '@/lib/utils/helpers'

export function useSubmissions() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSubmissionsForRoom = useCallback(async (roomId: string, shuffle = true): Promise<SubmissionWithAnswers[]> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          *,
          answers (*)
        `)
        .eq('room_id', roomId)
      
      if (submissionsError) throw submissionsError

      // Remove device_hash from response for privacy
      const sanitized = (submissions || []).map((s: any) => ({
        ...s,
        device_hash: '', // Never expose device hash
        answers: (s.answers || []).map((a: any) => ({
          ...a,
        })),
      }))

      // Shuffle to prevent identity inference
      return shuffle ? shuffleArray(sanitized) : sanitized
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const getSubmissionCount = useCallback(async (roomId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId)
      
      if (error) throw error
      return count || 0
    } catch (err: any) {
      console.error('Error getting submission count:', err)
      return 0
    }
  }, [supabase])

  const checkDeviceSubmitted = useCallback(async (roomId: string): Promise<boolean> => {
    const deviceHash = getDeviceHash()
    
    // Check localStorage first (client-side)
    if (hasSubmitted(roomId)) {
      return true
    }
    
    // Check server-side
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('id')
        .eq('room_id', roomId)
        .eq('device_hash', deviceHash)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found", which is expected
        throw error
      }
      
      if (data) {
        markAsSubmitted(roomId)
        return true
      }
      
      return false
    } catch (err: any) {
      if (err.code === 'PGRST116') return false
      console.error('Error checking submission:', err)
      return false
    }
  }, [supabase])

  const createSubmission = useCallback(async (
    roomId: string,
    answers: Omit<Answer, 'id' | 'created_at'>[]
  ): Promise<Submission | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const deviceHash = getDeviceHash()
      
      // Check if already submitted
      const alreadySubmitted = await checkDeviceSubmitted(roomId)
      if (alreadySubmitted) {
        throw new Error('You have already submitted to this room')
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

      // Mark as submitted in localStorage
      markAsSubmitted(roomId)

      return submissionData
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase, checkDeviceSubmitted])

  return {
    loading,
    error,
    fetchSubmissionsForRoom,
    getSubmissionCount,
    checkDeviceSubmitted,
    createSubmission,
  }
}

export function useSubmissionsData(roomId: string) {
  const { fetchSubmissionsForRoom } = useSubmissions()
  const [submissions, setSubmissions] = useState<SubmissionWithAnswers[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSubmissions() {
      const data = await fetchSubmissionsForRoom(roomId)
      setSubmissions(data)
      setLoading(false)
    }
    
    if (roomId) {
      loadSubmissions()
    }
  }, [roomId, fetchSubmissionsForRoom])

  return { 
    submissions, 
    loading, 
    error, 
    refetch: () => fetchSubmissionsForRoom(roomId).then(setSubmissions) 
  }
}
