'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Room } from '@/types'
import { getScoreMessage } from '@/lib/utils/score'
import { Logo, Button, Pill } from '@/components/shared'
import { useUser } from '@/hooks/useUser'

const formatRoomType = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, signOut } = useUser()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [safetyScore] = useState(84)
  const [sort, setSort] = useState<'recent' | 'open'>('recent')

  useEffect(() => {
    async function loadData() {
      if (!user) return
      const { data } = await supabase.from('rooms').select('*').eq('creator_id', user.id).order('created_at', { ascending: false })
      if (data) setRooms(data)
      setLoading(false)
    }
    loadData()
  }, [user, supabase])

  const sortedRooms = useMemo(() => [...rooms].sort((a, b) => sort === 'open' ? Number(b.status === 'open') - Number(a.status === 'open') : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [rooms, sort])
  const firstName = user?.user_metadata?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  if (loading) return <div className="loading-state">Loading your rooms...</div>

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" aria-label="Openly home"><Logo /></Link>
        <nav className="side-nav" aria-label="Main navigation">
          <button className="active" type="button"><span>⌂</span><b>Overview</b></button>
          <button type="button" onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })}><span>◌</span><b>My rooms</b><i>{rooms.length}</i></button>
          <button type="button" onClick={() => router.push('/settings')}><span>⚙</span><b>Settings</b></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-mini"><span>✦</span><p><strong>Privacy first</strong><small>No names. No pressure.</small></p></div>
          <div className="profile"><span className="avatar">{firstName.slice(0, 2).toUpperCase()}</span><p><strong>{firstName}</strong><small>Personal workspace</small></p><button className="dots" onClick={() => signOut()} aria-label="Sign out">···</button></div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar"><div><p className="eyebrow">Tuesday, August 24</p><h1>Good morning, {firstName}.</h1></div><div className="top-actions"><button className="icon-button notification" aria-label="Notifications">◔<i>2</i></button><button className="hamburger" aria-label="Open menu"><i /><i /></button></div></header>
        <main className="page-content">
          <section className="dashboard-head"><div><p className="eyebrow">Your quiet corner</p><h2>Good morning, {firstName}.</h2><p>Here&apos;s what your team is saying.</p></div><div className="head-actions"><Button onClick={() => router.push('/room/create')}>+ New room</Button></div></section>

          <section className="stats" aria-label="Workspace summary"><div><span className="eyebrow">Active rooms</span><b>{rooms.filter((room) => room.status === 'open').length}</b><small>Open right now</small></div><div><span className="eyebrow">Responses</span><b>{rooms.length ? rooms.length * 12 : 0}</b><small>Across your rooms</small></div><div><span className="eyebrow">Safety score</span><b>{safetyScore}</b><small>↑ 8 this cycle</small></div></section>

          <section className="safety-strip"><div className="safety-icon">✦</div><div><p className="eyebrow">Your space is feeling open</p><h3>Psychological safety <strong>{safetyScore}</strong><span>/ 100</span></h3><p>{getScoreMessage(safetyScore)}</p></div><Button onClick={() => router.push('/room/create')}>Create new room →</Button></section>

          <section id="rooms" className="section-block"><div className="section-heading"><div><p className="eyebrow">Your rooms <span className="count-badge">{rooms.length}</span></p><h3>Spaces worth returning to</h3></div><div className="tabs" role="tablist"><button className={sort === 'recent' ? 'selected' : ''} onClick={() => setSort('recent')}>Recent</button><button className={sort === 'open' ? 'selected' : ''} onClick={() => setSort('open')}>Open first</button></div></div>
            {sortedRooms.length === 0 ? <div className="empty-state"><span className="empty-mark">○</span><h3>Your first room is waiting.</h3><p>Give your team a place to say what they really mean.</p><Button onClick={() => router.push('/room/create')}>Create a room</Button></div> : <div className="bento">{sortedRooms.slice(0, 6).map((room, index) => <article key={room.id} className={`room-card ${index === 0 ? 'large' : ''}`} onClick={() => router.push(`/room/${room.id}/results`)}><div className="card-top"><Pill>{formatRoomType(room.type)}</Pill><span aria-hidden="true">↗</span></div><h3>{room.name}</h3><p>{room.description || 'A space for honest reflection.'}</p><div className="card-meta"><span className={room.status === 'open' ? 'status-open' : ''}>{room.status === 'open' ? 'Open for responses' : 'Closed'}</span><span aria-hidden="true">·</span><span>{room.closes_at ? `Closes ${new Date(room.closes_at).toLocaleDateString()}` : 'No closing date'}</span></div></article>)}</div>}
          </section>

        </main>
      </div>
    </div>
  )
}
