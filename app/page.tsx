'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/layout/AppShell'
import { Button, Pill } from '@/components/shared'
import { useUser } from '@/hooks/useUser'
import { Answer, Room, SafetyScore, Submission, Thread } from '@/types'
import { calculateSafetyScore } from '@/lib/utils/score'
import { ACCENTS, roomTypeLabel } from '@/constants'

export default function HomePage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [rooms, setRooms] = useState<Room[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [safety, setSafety] = useState<SafetyScore | null>(null)

  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    async function load(creatorId: string) {
      const { data: roomsData } = await supabase
        .from('rooms')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false })

      const list = (roomsData as Room[]) || []
      setRooms(list)
      if (list.length === 0) return

      const roomIds = list.map(r => r.id)
      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('*, answers (*)')
        .in('room_id', roomIds)
      const { data: threadsData } = await supabase
        .from('threads')
        .select('*, thread_messages (*)')
        .in('room_id', roomIds)

      const submissions = ((submissionsData as (Submission & { answers: Answer[] })[]) || [])
      const perRoom: Record<string, number> = {}
      submissions.forEach(s => { perRoom[s.room_id] = (perRoom[s.room_id] || 0) + 1 })
      setCounts(perRoom)

      if (submissions.length > 0) {
        const answers = submissions.flatMap(s => s.answers || [])
        const invited = list.reduce((sum, r) => sum + (r.max_participants || 0), 0) || submissions.length
        setSafety(
          calculateSafetyScore(
            submissions,
            answers,
            (threadsData as Thread[]) || [],
            [],
            invited,
            list.some(r => r.is_recurring)
          )
        )
      }
    }

    load(user.id)
  }, [user])

  const title = user ? `Good to see you, ${(user.user_metadata?.name as string | undefined) || user.email?.split('@')[0]}.` : 'Welcome to openly.'

  return (
    <AppShell title={title}>
      <div className="page-content home-page">
        <section className="hero">
          <div className="hero-copy-wrap">
            <Pill>For the thoughts between the lines</Pill>
            <h2>Say what you<br /><em>really</em> mean.</h2>
            <p className="hero-copy">
              A structured, anonymous space for feedback that does more than collect answers. Make room for the real stuff.
            </p>
            <div className="hero-actions">
              <Button onClick={() => router.push(user ? '/room/create' : '/signup')}>Start a room <span>→</span></Button>
              <button className="link-button" onClick={() => router.push('/explore')}>Explore rooms <span>↗</span></button>
            </div>
          </div>
          <div className="hero-art">
            <div className="art-ring"><span>01</span></div>
            <span className="art-word">openly</span>
            <span className="art-caption">no performance<br />required</span>
            <div className="art-stamp">anonymous<br />by design</div>
          </div>
        </section>

        <section className="section-head">
          <div>
            <p className="eyebrow">Your rooms {rooms.length > 0 && <span className="count-badge">{rooms.length}</span>}</p>
            <h3>Spaces worth returning to</h3>
          </div>
          <button className="text-button" onClick={() => router.push('/rooms')}>See all rooms →</button>
        </section>

        {!user && !userLoading ? (
          <div className="empty-state">
            <p>Sign in to see the rooms you have opened — or explore what others are asking.</p>
            <Button onClick={() => router.push('/login')}>Sign in <span>→</span></Button>
          </div>
        ) : rooms.length === 0 ? (
          <div className="empty-state">
            <p>No rooms yet. Your first one can be a small question.</p>
            <Button onClick={() => router.push('/room/create')}>Create a room <span>→</span></Button>
          </div>
        ) : (
          <div className="bento">
            {rooms.slice(0, 3).map((room, i) => {
              const responses = counts[room.id] || 0
              const progress = room.max_participants ? `${Math.min(100, Math.round((responses / room.max_participants) * 100))}%` : undefined
              return (
                <article
                  className={`room-card ${ACCENTS[i % ACCENTS.length]} ${i === 0 ? 'large' : ''}`}
                  key={room.id}
                  onClick={() => router.push(`/room/${room.id}/results`)}
                >
                  <div className="room-top"><Pill>{roomTypeLabel(room.type)}</Pill><span>↗</span></div>
                  <div>
                    <h3>{room.name}</h3>
                    <p>{room.max_participants ? `${responses} of ${room.max_participants} responded` : `${responses} reflections`}</p>
                    {progress && <div className="progress"><span style={{ width: progress }}></span></div>}
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {safety && (
          <section className="safety-strip">
            <div className="safety-icon">✦</div>
            <div>
              <p className="eyebrow">Your space is feeling open</p>
              <h3>Psychological safety <strong>{safety.score}</strong><span>/ 100</span></h3>
              <p>{safety.explanation}</p>
            </div>
            <button onClick={() => router.push(rooms[0] ? `/room/${rooms[0].id}/results` : '/rooms')}>View the story →</button>
          </section>
        )}
      </div>
    </AppShell>
  )
}
