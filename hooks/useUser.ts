'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export function useUser() {
  // Don't create client during build if env vars are missing
  if (typeof window === 'undefined' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return {
      user: null,
      loading: false,
      error: null,
      signOut: async () => {},
      updateProfile: async () => {},
    }
  }

  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) throw error
        
        setUser(user)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const updateProfile = async (updates: {
    name?: string
    email?: string
  }): Promise<User | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      })
      
      if (error) throw error
      
      setUser(data.user)
      return data.user
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const signOut = async (): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      try {
        await fetch('/api/auth/logout', { method: 'POST' })
      } catch {}

      const { error } = await supabase.auth.signOut()
      
      if (error) throw error
      
      setUser(null)
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    error,
    updateProfile,
    signOut,
  }
}
