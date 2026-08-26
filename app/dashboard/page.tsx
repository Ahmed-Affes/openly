'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Room } from '@/types'
import { calculateSafetyScore, getScoreMessage } from '@/lib/utils/score'
import { Logo, Button, RoomTypeBadge, ConfirmModal } from '@/components/shared'
import { useUser } from '@/hooks/useUser'
import { 
  House, 
  GridFour, 
  GearSix, 
  Sparkle, 
  ArrowUpRight, 
  Copy, 
  ChartBar, 
  XCircle, 
  Plus,
  Check,
  Bell,
  SignOut,
  Trash,
  PencilSimple,
  ArrowClockwise
} from '@phosphor-icons/react'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, signOut } = useUser()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [roomToDelete, setRoomToDelete] = useState<{ id: string; name: string } | null>(null)
  const [deletingRoom, setDeletingRoom] = useState(false)
  const [safetyMetrics, setSafetyMetrics] = useState({
    score: 84,
    trend: 'stable' as 'up' | 'down' | 'stable',
    explanation: 'Give your team a quiet space to share what is real.'
  })
  const [sort, setSort] = useState<'recent' | 'open'>('recent')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      if (!user) return
      
      // 1. Load creator's rooms
      const { data: roomData } = await supabase
        .from('rooms')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
      
      if (roomData) {
        setRooms(roomData)

        // 2. Load submissions, answers, and threads to calculate dynamic safety score
        const roomIds = roomData.map(r => r.id)
        if (roomIds.length > 0) {
          const [{ data: submissions }, { data: threads }] = await Promise.all([
            supabase
              .from('submissions')
              .select('*, answers(*)')
              .in('room_id', roomIds),
            supabase
              .from('threads')
              .select('*, thread_messages(*)')
              .in('room_id', roomIds),
          ])

          const allSubmissions = submissions || []
          const allAnswers = allSubmissions.flatMap((s: any) => s.answers || [])
          const allThreads = threads || []

          if (allSubmissions.length > 0) {
            const calculated = calculateSafetyScore(
              allSubmissions,
              allAnswers,
              allThreads,
              [],
              allSubmissions.length * 2,
              roomData.some(r => r.is_recurring)
            )
            setSafetyMetrics({
              score: calculated.score,
              trend: calculated.trend,
              explanation: calculated.explanation,
            })
          } else {
            setSafetyMetrics({
              score: 85,
              trend: 'stable',
              explanation: 'Waiting for your first responses to calibrate team openness.',
            })
          }
        }
      }
      setLoading(false)
    }
    loadData()
  }, [user, supabase])

  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => 
      sort === 'open' 
        ? Number(b.status === 'open') - Number(a.status === 'open') 
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [rooms, sort])

  const firstName = user?.user_metadata?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  // Time-aware greeting in Fraunces
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  const copyRoomLink = (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation()
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/r/${roomId}`
      navigator.clipboard.writeText(url)
      setCopiedId(roomId)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const handleCloseRoom = async (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/rooms/${roomId}/close`, { method: 'POST' })
      if (res.ok) {
        setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: 'closed' } : r))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleReopenRoom = async (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'open', closes_at: null }),
      })
      if (res.ok) {
        setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: 'open', closes_at: null } : r))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteRoom = (e: React.MouseEvent, roomId: string, roomName: string) => {
    e.stopPropagation()
    setRoomToDelete({ id: roomId, name: roomName })
  }

  const confirmDeleteRoom = async () => {
    if (!roomToDelete) return
    setDeletingRoom(true)
    try {
      const res = await fetch(`/api/rooms/${roomToDelete.id}`, { method: 'DELETE' })
      if (res.ok) {
        setRooms(prev => prev.filter(r => r.id !== roomToDelete.id))
      }
    } catch (err) {
      console.error('Failed to delete room:', err)
    } finally {
      setDeletingRoom(false)
      setRoomToDelete(null)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f0e8] text-[#6b5c4e]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#c2674a] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-medium text-sm">Opening your quiet corner…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      {/* Sticky Desktop Sidebar */}
      <aside className="sidebar">
        <Link href="/" aria-label="Openly home">
          <Logo />
        </Link>
        
        <nav className="side-nav" aria-label="Main navigation">
          <button className="active" type="button">
            <span><House size={20} weight="fill" /></span>
            <b>Overview</b>
          </button>
          <button 
            type="button" 
            onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span><GridFour size={20} /></span>
            <b>My rooms</b>
            <i>{rooms.length}</i>
          </button>
          <button type="button" onClick={() => router.push('/settings')}>
            <span><GearSix size={20} /></span>
            <b>Settings</b>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="privacy-mini">
            <span><Sparkle size={18} weight="fill" /></span>
            <p>
              <strong>Privacy first</strong>
              <small>No names. No pressure.</small>
            </p>
          </div>
          <div className="profile">
            <span className="avatar">{firstName.slice(0, 2).toUpperCase()}</span>
            <p>
              <strong>{firstName}</strong>
              <small>Personal workspace</small>
            </p>
            <button 
              className="dots p-2 rounded-lg hover:bg-[#ede8dc] text-muted-foreground hover:text-heading transition" 
              onClick={handleSignOut} 
              title="Sign out of workspace"
              aria-label="Sign out"
            >
              <SignOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main pb-24 md:pb-8">
        <header className="topbar">
          <div>
            <p className="eyebrow">{currentDateFormatted}</p>
            <h1 className="font-serif text-3xl font-medium">{getGreeting()}, {firstName}.</h1>
          </div>
          <div className="top-actions flex items-center gap-3">
            <Button onClick={() => router.push('/room/create')}>
              <Plus size={16} weight="bold" />
              <span>New room</span>
            </Button>
          </div>
        </header>

        <main className="page-content">
          {/* Stats Bar */}
          <motion.section 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="stats" 
            aria-label="Workspace summary"
          >
            <div>
              <span className="eyebrow">Active rooms</span>
              <b>{rooms.filter((room) => room.status === 'open').length}</b>
              <small>Open for responses right now</small>
            </div>
            <div>
              <span className="eyebrow">Total Rooms</span>
              <b>{rooms.length}</b>
              <small>Created across workspace</small>
            </div>
            <div>
              <span className="eyebrow">Safety score</span>
              <b>{safetyMetrics.score}</b>
              <small className="text-[#7c8c5e] font-semibold">
                {safetyMetrics.trend === 'up' ? '↑ Increasing trust' : 'Calibrated team index'}
              </small>
            </div>
          </motion.section>

          {/* Safety score widget ALWAYS ABOVE rooms list */}
          <motion.section 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="safety-strip"
          >
            <div className="safety-icon">
              <Sparkle size={26} weight="fill" />
            </div>
            <div className="flex-1">
              <p className="eyebrow text-[#7c8c5e]">Psychological Safety Index</p>
              <h3>
                Team openness score <strong>{safetyMetrics.score}</strong>
                <span> / 100</span>
              </h3>
              <p>{safetyMetrics.explanation || getScoreMessage(safetyMetrics.score)}</p>
            </div>
            <Button onClick={() => router.push('/room/create')}>
              Create new room →
            </Button>
          </motion.section>

          {/* Rooms List Section */}
          <section id="rooms" className="section-block mt-8">
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  Your rooms <span className="count-badge">{rooms.length}</span>
                </p>
                <h3 className="font-serif">Spaces worth returning to</h3>
              </div>
              <div className="tabs" role="tablist">
                <button 
                  className={sort === 'recent' ? 'selected' : ''} 
                  onClick={() => setSort('recent')}
                >
                  Recent
                </button>
                <button 
                  className={sort === 'open' ? 'selected' : ''} 
                  onClick={() => setSort('open')}
                >
                  Open first
                </button>
              </div>
            </div>

            {sortedRooms.length === 0 ? (
              <div className="empty-state text-center py-16">
                <div className="w-14 h-14 rounded-full bg-[#faf7f2] border border-[#ddd5c8] grid place-items-center mx-auto mb-4 text-[#c2674a]">
                  <GridFour size={28} />
                </div>
                <h3 className="font-serif text-2xl">Your first room is waiting.</h3>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                  Give your team a place to say what they really mean without pressure or bias.
                </p>
                <div className="mt-6">
                  <Button onClick={() => router.push('/room/create')}>
                    Create a room
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bento">
                {sortedRooms.map((room, idx) => (
                  <motion.article 
                    key={room.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.04 }}
                    className="room-card group" 
                    onClick={() => router.push(`/room/${room.id}/results`)}
                  >
                    <div className="card-top">
                      <RoomTypeBadge type={room.type} />
                      <span className="text-muted-foreground group-hover:text-heading group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" aria-hidden="true">
                        <ArrowUpRight size={18} />
                      </span>
                    </div>

                    <div>
                      <h3 className="font-serif text-xl font-medium">{room.name}</h3>
                      <p>{room.description || 'A space for honest reflection and feedback.'}</p>
                    </div>

                    <div>
                      {/* Status & Close date separated by " · " */}
                      <div className="card-meta">
                        <span className={room.status === 'open' ? 'status-open' : ''}>
                          {room.status === 'open' ? 'Open for responses' : 'Closed'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {room.closes_at 
                            ? `Closes ${new Date(room.closes_at).toLocaleDateString()}` 
                            : 'No closing date'}
                        </span>
                      </div>

                      {/* CRUD Actions on Card */}
                      <div className="card-actions-hover pt-2 flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => copyRoomLink(e, room.id)}
                          className="px-2.5 py-1.5 bg-[#faf7f2] border border-[#ddd5c8] rounded-lg text-xs font-medium text-heading hover:bg-[#1c1917] hover:text-[#f5f0e8] transition flex items-center gap-1"
                          title="Copy public responder link"
                        >
                          {copiedId === room.id ? (
                            <>
                              <Check size={13} className="text-[#7c8c5e]" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/room/${room.id}/results`)
                          }}
                          className="px-2.5 py-1.5 bg-[#faf7f2] border border-[#ddd5c8] rounded-lg text-xs font-medium text-heading hover:bg-[#1c1917] hover:text-[#f5f0e8] transition flex items-center gap-1"
                          title="View insights and responses"
                        >
                          <ChartBar size={13} />
                          <span>Results</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/room/${room.id}`)
                          }}
                          className="px-2.5 py-1.5 bg-[#faf7f2] border border-[#ddd5c8] rounded-lg text-xs font-medium text-heading hover:bg-[#1c1917] hover:text-[#f5f0e8] transition flex items-center gap-1"
                          title="Edit room settings and questions"
                        >
                          <PencilSimple size={13} />
                          <span>Edit</span>
                        </button>

                        {room.status === 'open' ? (
                          <button
                            type="button"
                            onClick={(e) => handleCloseRoom(e, room.id)}
                            className="px-2 py-1.5 bg-[#faf7f2] border border-[#ddd5c8] rounded-lg text-xs font-medium text-muted-foreground hover:bg-[#1c1917] hover:text-[#f5f0e8] transition flex items-center gap-1"
                            title="Close room to new responses"
                          >
                            <XCircle size={13} />
                            <span>Close</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleReopenRoom(e, room.id)}
                            className="px-2 py-1.5 bg-[#faf7f2] border border-[#ddd5c8] rounded-lg text-xs font-medium text-[#7c8c5e] hover:bg-[#7c8c5e] hover:text-white transition flex items-center gap-1"
                            title="Reopen room for responses"
                          >
                            <ArrowClockwise size={13} />
                            <span>Reopen</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleDeleteRoom(e, room.id, room.name)}
                          className="p-1.5 bg-[#faf7f2] border border-[#ddd5c8] rounded-lg text-xs text-[#c0392b] hover:bg-[#c0392b] hover:text-white transition ml-auto"
                          title="Delete room permanently"
                        >
                          <Trash size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-nav-bar" aria-label="Mobile navigation">
        <button 
          className="mobile-nav-item active" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <House size={20} weight="fill" />
          <span>Overview</span>
        </button>
        <button 
          className="mobile-nav-item" 
          onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <GridFour size={20} />
          <span>Rooms ({rooms.length})</span>
        </button>
        <button 
          className="mobile-nav-item !text-[#c2674a]" 
          onClick={() => router.push('/room/create')}
        >
          <Plus size={22} weight="bold" />
          <span>New</span>
        </button>
        <button 
          className="mobile-nav-item" 
          onClick={() => router.push('/settings')}
        >
          <GearSix size={20} />
          <span>Settings</span>
        </button>
      </nav>

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={!!roomToDelete}
        title="Delete this room?"
        description={`Are you sure you want to delete "${roomToDelete?.name}"? All responses, questions, and anonymous discussion threads will be permanently erased.`}
        confirmText="Delete Room"
        cancelText="Keep Room"
        variant="danger"
        loading={deletingRoom}
        onClose={() => setRoomToDelete(null)}
        onConfirm={confirmDeleteRoom}
      />
    </div>
  )
}
