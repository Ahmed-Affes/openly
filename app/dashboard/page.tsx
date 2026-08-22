'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Room } from '@/types'
import { calculateSafetyScore, getScoreColor, getScoreMessage } from '@/lib/utils/score'
import { Logo, Button, Pill } from '@/components/shared'
import { useUser } from '@/hooks/useUser'

export default function DashboardPage() {
  // Don't render during build if env vars are missing
  if (typeof window === 'undefined' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return null
  }

  const router = useRouter()
  const supabase = createClient()
  const { user, signOut } = useUser()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [safetyScore, setSafetyScore] = useState(0)

  useEffect(() => {
    async function loadData() {
      if (!user) return

      // Fetch rooms
      const { data: roomsData } = await supabase
        .from('rooms')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })

      if (roomsData) {
        setRooms(roomsData)
      }

      // Calculate safety score (simplified version)
      // In production, this would use the full calculation with submissions data
      const score = Math.floor(Math.random() * 40) + 60 // 60-100 for demo
      setSafetyScore(score)

      setLoading(false)
    }

    loadData()
  }, [user, supabase])

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <div className="text-[#6B6B6B]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E5] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <span className="text-[#6B6B6B]">{user?.user_metadata?.name || 'User'}</span>
            <button onClick={handleSignOut} className="text-sm text-[#8B7355] hover:underline">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <section className="mb-12">
          <Pill>For the thoughts between the lines</Pill>
          <h1 className="text-4xl font-serif text-[#2D2D2D] mt-4 mb-2">
            Say what you <em>really</em> mean.
          </h1>
          <p className="text-[#6B6B6B] max-w-xl">
            A structured, anonymous space for feedback that does more than collect answers. Make room for the real stuff.
          </p>
          <div className="flex gap-4 mt-6">
            <Button onClick={() => router.push('/room/create')}>
              Start a room <span>→</span>
            </Button>
          </div>
        </section>

        {/* Rooms Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="eyebrow">Your rooms <span className="count-badge">{rooms.length}</span></p>
              <h3 className="text-2xl font-serif text-[#2D2D2D]">Spaces worth returning to</h3>
            </div>
          </div>

          {rooms.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-[#E5E5E5]">
              <p className="text-[#6B6B6B] mb-4">No rooms yet. Create your first room to get started.</p>
              <Button onClick={() => router.push('/room/create')}>
                Create a room
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.slice(0, 6).map((room, i) => (
                <article
                  key={room.id}
                  className={`room-card ${i === 0 ? 'large' : ''} bg-white rounded-lg border border-[#E5E5E5] p-6 cursor-pointer hover:shadow-lg transition-shadow`}
                  onClick={() => router.push(`/room/${room.id}/results`)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Pill>{room.type}</Pill>
                    <span>↗</span>
                  </div>
                  <h3 className="text-lg font-medium text-[#2D2D2D] mb-2">{room.name}</h3>
                  <p className="text-sm text-[#6B6B6B] mb-4">
                    {room.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B6B6B]">{room.status}</span>
                    {room.closes_at && (
                      <span className="text-[#6B6B6B]">
                        Closes {new Date(room.closes_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Safety Score Section */}
        {rooms.length > 0 && (
          <section className="safety-strip bg-white rounded-lg border border-[#E5E5E5] p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="safety-icon text-3xl">✦</div>
              <div>
                <p className="eyebrow">Your space is feeling open</p>
                <h3 className="text-xl font-serif text-[#2D2D2D]">
                  Psychological safety <strong>{safetyScore}</strong>
                  <span className="text-[#6B6B6B]">/ 100</span>
                </h3>
                <p className="text-sm text-[#6B6B6B]">{getScoreMessage(safetyScore)}</p>
              </div>
            </div>
            <Button onClick={() => router.push('/room/create')}>
              Create new room →
            </Button>
          </section>
        )}
      </main>
    </div>
  )
}
