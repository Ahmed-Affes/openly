'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'

export default function SettingsPage() {
  // Don't render during build if env vars are missing
  if (typeof window === 'undefined' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return null
  }

  const router = useRouter()
  const supabase = createClient()
  const { user, signOut, updateProfile } = useUser()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const handleUpdateProfile = async (updates: { name?: string }) => {
    setLoading(true)
    setMessage('')
    
    try {
      await updateProfile(updates)
      setMessage('Profile updated successfully')
    } catch (err: any) {
      setMessage(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailNotifications = async () => {
    const newValue = !emailNotifications
    setEmailNotifications(newValue)
    
    // In production, this would save to user_settings table
    // For now, we'll just show a message
    setMessage(newValue ? 'Email notifications enabled' : 'Email notifications disabled')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <div className="text-[#6B6B6B]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p className="eyebrow text-[#8B7355]">Your space</p>
          <h1 className="text-3xl font-serif text-[#2D2D2D] mt-2 mb-2">
            Keep it <em>comfortable.</em>
          </h1>
          <p className="text-[#6B6B6B]">
            Small choices that keep Openly feeling like Openly.
          </p>
        </div>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {message}
          </div>
        )}

        <div className="space-y-4">
          {/* Profile */}
          <button className="w-full bg-white rounded-lg border border-[#E5E5E5] p-6 flex items-center justify-between hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <span className="setting-icon text-2xl">○</span>
              <div className="text-left">
                <strong className="block text-[#2D2D2D]">Your profile</strong>
                <small className="text-[#6B6B6B]">
                  {user.user_metadata?.name || 'User'} · {user.email}
                </small>
              </div>
            </div>
            <span className="text-[#6B6B6B]">→</span>
          </button>

          {/* Email Notifications */}
          <button
            onClick={handleEmailNotifications}
            className="w-full bg-white rounded-lg border border-[#E5E5E5] p-6 flex items-center justify-between hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <span className="setting-icon text-2xl">♧</span>
              <div className="text-left">
                <strong className="block text-[#2D2D2D]">Email nudges</strong>
                <small className="text-[#6B6B6B]">
                  {emailNotifications 
                    ? 'A gentle nudge, never a buzz' 
                    : 'Notifications are paused'}
                </small>
              </div>
            </div>
            <span className={`toggle ${emailNotifications ? 'on' : ''}`}>
              <i></i>
            </span>
          </button>

          {/* Privacy */}
          <button className="w-full bg-white rounded-lg border border-[#E5E5E5] p-6 flex items-center justify-between hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <span className="setting-icon text-2xl">✦</span>
              <div className="text-left">
                <strong className="block text-[#2D2D2D]">Privacy & anonymity</strong>
                <small className="text-[#6B6B6B]">Your answers are always anonymous</small>
              </div>
            </div>
            <span className="text-[#6B6B6B]">→</span>
          </button>

          {/* About */}
          <button className="w-full bg-white rounded-lg border border-[#E5E5E5] p-6 flex items-center justify-between hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <span className="setting-icon text-2xl">?</span>
              <div className="text-left">
                <strong className="block text-[#2D2D2D]">About Openly</strong>
                <small className="text-[#6B6B6B]">Our values and house rules</small>
              </div>
            </div>
            <span className="text-[#6B6B6B]">→</span>
          </button>
        </div>

        {/* Privacy Card */}
        <div className="privacy-card bg-white rounded-lg border border-[#E5E5E5] p-6 mt-8 flex items-start gap-4">
          <span className="text-3xl">✦</span>
          <div>
            <strong className="block text-[#2D2D2D] mb-2">Built for honest rooms.</strong>
            <p className="text-[#6B6B6B]">
              We never show names, store IP addresses, or sell your thoughts. 
              Rooms quietly disappear after 90 days of inactivity.
            </p>
          </div>
        </div>

        {/* Sign Out */}
        <div className="mt-8">
          <button
            onClick={handleSignOut}
            className="w-full py-3 text-[#6B6B6B] hover:text-[#2D2D2D] border border-[#E5E5E5] rounded-lg hover:border-[#8B7355] transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
