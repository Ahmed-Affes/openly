'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Vote, VoteType } from '@/types'
import { getDeviceHash } from '@/lib/utils/fingerprint'

export function useVotes() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVotesForRoom = async (roomId: string): Promise<Vote[]> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('room_id', roomId)
      
      if (error) throw error

      // Remove device_hash from response for privacy
      const sanitized = (data || []).map(v => ({
        ...v,
        device_hash: '',
      }))

      return sanitized
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }

  const fetchVotesForSubmission = async (submissionId: string): Promise<Vote[]> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('submission_id', submissionId)
      
      if (error) throw error

      const sanitized = (data || []).map(v => ({
        ...v,
        device_hash: '',
      }))

      return sanitized
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }

  const checkDeviceVoted = async (submissionId: string): Promise<boolean> => {
    const deviceHash = getDeviceHash()
    
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('id')
        .eq('submission_id', submissionId)
        .eq('device_hash', deviceHash)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        throw error
      }
      
      return !!data
    } catch (err: any) {
      if (err.code === 'PGRST116') return false
      console.error('Error checking vote:', err)
      return false
    }
  }

  const submitVote = async (
    submissionId: string,
    roomId: string,
    voteType: VoteType
  ): Promise<Vote | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const deviceHash = getDeviceHash()
      
      // Check if already voted
      const alreadyVoted = await checkDeviceVoted(submissionId)
      if (alreadyVoted) {
        throw new Error('You have already voted on this submission')
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

      return {
        ...data,
        device_hash: '', // Never expose device hash
      }
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const getVoteCounts = async (submissionId: string): Promise<Record<VoteType, number>> => {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('submission_id', submissionId)
      
      if (error) throw error

      const counts: Record<VoteType, number> = {
        up: 0,
        down: 0,
        yes: 0,
        no: 0,
        unsure: 0,
      } as Record<VoteType, number>

      (data || []).forEach((vote: any) => {
        const voteType = vote.vote_type as VoteType
        if (voteType in counts) {
          counts[voteType]++
        }
      })

      return counts
    } catch (err: any) {
      console.error('Error getting vote counts:', err)
      return {
        up: 0,
        down: 0,
        yes: 0,
        no: 0,
        unsure: 0,
      }
    }
  }

  return {
    loading,
    error,
    fetchVotesForRoom,
    fetchVotesForSubmission,
    checkDeviceVoted,
    submitVote,
    getVoteCounts,
  }
}

export function useVotesData(roomId: string) {
  const { fetchVotesForRoom } = useVotes()
  const [votes, setVotes] = useState<Vote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadVotes() {
      const data = await fetchVotesForRoom(roomId)
      setVotes(data)
      setLoading(false)
    }
    
    if (roomId) {
      loadVotes()
    }
  }, [roomId, fetchVotesForRoom])

  return { 
    votes, 
    loading, 
    error, 
    refetch: () => fetchVotesForRoom(roomId).then(setVotes) 
  }
}
