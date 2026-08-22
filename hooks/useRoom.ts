'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Room, RoomWithQuestions, Question } from '@/types'

export function useRoom() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRoom = async (roomId: string): Promise<Room | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single()
      
      if (error) throw error
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const fetchRoomWithQuestions = async (roomId: string): Promise<RoomWithQuestions | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          questions (*)
        `)
        .eq('id', roomId)
        .single()
      
      if (error) throw error
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const fetchCreatorRooms = async (creatorId: string): Promise<Room[]> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }

  const createRoom = async (room: Partial<Room>, questions: Omit<Question, 'id' | 'created_at'>[]): Promise<RoomWithQuestions | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create room with questions in a transaction
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

      return {
        ...roomData,
        questions: questionsToInsert.map((q, i) => ({
          ...q,
          id: '', // Will be assigned by Supabase
          created_at: new Date().toISOString(),
        })),
      }
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateRoom = async (roomId: string, updates: Partial<Room>): Promise<Room | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('rooms')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', roomId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const closeRoom = async (roomId: string): Promise<Room | null> => {
    return updateRoom(roomId, { status: 'closed' })
  }

  const deleteRoom = async (roomId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId)
      
      if (error) throw error
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    fetchRoom,
    fetchRoomWithQuestions,
    fetchCreatorRooms,
    createRoom,
    updateRoom,
    closeRoom,
    deleteRoom,
  }
}

export function useRoomData(roomId: string) {
  const { fetchRoomWithQuestions } = useRoom()
  const [room, setRoom] = useState<RoomWithQuestions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadRoom() {
      const data = await fetchRoomWithQuestions(roomId)
      setRoom(data)
      setLoading(false)
      if (!data) setError('Room not found')
    }
    
    if (roomId) {
      loadRoom()
    }
  }, [roomId, fetchRoomWithQuestions])

  return { room, loading, error, refetch: () => fetchRoomWithQuestions(roomId).then(setRoom) }
}
