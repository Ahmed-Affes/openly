'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/layout/AppShell'
import { Button, Pill } from '@/components/shared'
import { useUser } from '@/hooks/useUser'
import { ACCENTS, roomTypeLabel } from '@/constants'
import { Room } from '@/types'
import { formatDate } from '@/lib/utils/helpers'

export default function RoomsPage() {
  const router = useRouter()
  const { user } = useUser()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    async function load(creatorId: string) {
      const { data } = await supabase
        .from('rooms')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false })
      setRooms((data as Room[]) || [])
      setLoading(false)
    }

    load(user.id)
  }, [user])

  return (
    <AppShell title="Results">
      <div className="page-content">
        <section className="intro">
          <p className="eyebrow accent">Your rooms</p>
          <h2>Everything you<br /><em>made space for.</em></h2>
          <p>Open a room to read what people shared.</p>
        </section>

        {loading ? (
          <div className="empty-state"><p>Gathering your rooms…</p></div>
        ) : rooms.length === 0 ? (
          <div className="empty-state">
            <p>No rooms yet. Your first one can be a small question.</p>
            <Button onClick={() => router.push('/room/create')}>Create a room <span>→</span></Button>
          </div>
        ) : (
          <div className="explore-grid">
            {rooms.map((room, i) => (
              <article className={`explore-card ${ACCENTS[i % ACCENTS.length]}`} key={room.id}>
                <div className="card-top">
                  <Pill>{roomTypeLabel(room.type)}</Pill>
                  <span className="live-dot">{room.status === 'open' ? '● Live' : '○ Closed'}</span>
                </div>
                <h3>{room.name}</h3>
                <p>{room.description || 'No description yet.'}</p>
                <div className="card-foot">
                  <span>{room.closes_at ? `Closes ${formatDate(room.closes_at)}` : `Opened ${formatDate(room.created_at)}`}</span>
                  <button onClick={() => router.push(`/room/${room.id}/results`)}>See results　→</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
