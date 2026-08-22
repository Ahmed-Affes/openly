'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/layout/AppShell'
import { Pill } from '@/components/shared'
import { ACCENTS, ROOM_TYPES, roomTypeLabel } from '@/constants'
import { Room } from '@/types'
import { formatDateTime } from '@/lib/utils/helpers'

const FILTERS = ['All rooms', ...ROOM_TYPES.map(t => t.label)]

export default function ExplorePage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [filter, setFilter] = useState('All rooms')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data } = await supabase
        .from('rooms')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
      setRooms((data as Room[]) || [])
      setLoading(false)
    }

    load()
  }, [])

  const visible = filter === 'All rooms' ? rooms : rooms.filter(r => roomTypeLabel(r.type) === filter)

  return (
    <AppShell title="Explore">
      <div className="page-content">
        <section className="intro split-intro">
          <div>
            <p className="eyebrow accent">Find your people</p>
            <h2>Rooms with<br /><em>something to say.</em></h2>
            <p>Browse conversations that feel a little more human.</p>
          </div>
          <div className="explore-note">
            <span>“</span>
            <p>Sometimes the bravest thing is asking a better question.</p>
            <small>— openly note 04</small>
          </div>
        </section>

        <div className="filter-row">
          {FILTERS.map(x => (
            <button key={x} className={`filter ${filter === x ? 'active' : ''}`} onClick={() => setFilter(x)}>{x}</button>
          ))}
        </div>

        <div className="explore-toolbar">
          <span><strong>{visible.length}</strong> open room{visible.length === 1 ? '' : 's'}</span>
          <button>Sort: Most recent　⌄</button>
        </div>

        {loading ? (
          <div className="empty-state"><p>Looking for open rooms…</p></div>
        ) : visible.length === 0 ? (
          <div className="empty-state"><p>No open rooms here yet. Quiet, for now.</p></div>
        ) : (
          <div className="explore-grid">
            {visible.map((room, i) => (
              <article className={`explore-card ${ACCENTS[i % ACCENTS.length]}`} key={room.id}>
                <div className="card-top">
                  <Pill>{roomTypeLabel(room.type)}</Pill>
                  <span className="live-dot">● Live</span>
                </div>
                <h3>{room.name}</h3>
                <p>{room.description || 'A place to share what is on your mind, without needing to have it figured out.'}</p>
                <div className="card-foot">
                  <span>Opened {formatDateTime(room.created_at)}</span>
                  <button onClick={() => router.push(`/r/${room.id}`)}>Enter room　→</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
