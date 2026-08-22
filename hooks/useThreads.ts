'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Thread, ThreadMessage } from '@/types'

export function useThreads() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchThreadsForRoom = async (roomId: string): Promise<Thread[]> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('threads')
        .select(`
          *,
          thread_messages (*)
        `)
        .eq('room_id', roomId)
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

  const fetchThread = async (threadId: string): Promise<Thread | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('threads')
        .select(`
          *,
          thread_messages (*)
        `)
        .eq('id', threadId)
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

  const createThread = async (
    submissionId: string,
    roomId: string
  ): Promise<Thread | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('threads')
        .insert({
          submission_id: submissionId,
          room_id: roomId,
        })
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

  const addMessage = async (
    threadId: string,
    sender: 'creator' | 'responder',
    text: string
  ): Promise<ThreadMessage | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('thread_messages')
        .insert({
          thread_id: threadId,
          sender,
          text,
        })
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

  const resolveThread = async (threadId: string, resolved: boolean): Promise<Thread | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('threads')
        .update({ is_resolved: resolved })
        .eq('id', threadId)
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

  const pinThread = async (threadId: string, pinned: boolean): Promise<Thread | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('threads')
        .update({ is_pinned: pinned })
        .eq('id', threadId)
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

  return {
    loading,
    error,
    fetchThreadsForRoom,
    fetchThread,
    createThread,
    addMessage,
    resolveThread,
    pinThread,
  }
}

export function useThreadsData(roomId: string) {
  const { fetchThreadsForRoom } = useThreads()
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadThreads() {
      const data = await fetchThreadsForRoom(roomId)
      setThreads(data)
      setLoading(false)
    }
    
    if (roomId) {
      loadThreads()
    }
  }, [roomId, fetchThreadsForRoom])

  return { 
    threads, 
    loading, 
    error, 
    refetch: () => fetchThreadsForRoom(roomId).then(setThreads) 
  }
}

export function useThreadRealtime(threadId: string) {
  const supabase = createClient()
  const [messages, setMessages] = useState<ThreadMessage[]>([])

  useEffect(() => {
    if (!threadId) return

    // Subscribe to thread messages
    const channel = supabase
      .channel(`thread:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'thread_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages(prev => [...prev, payload.new as ThreadMessage])
          }
        }
      )
      .subscribe()

    // Load initial messages
    supabase
      .from('thread_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [threadId, supabase])

  return { messages }
}
