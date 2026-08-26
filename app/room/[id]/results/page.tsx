'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RoomWithQuestions, Thread } from '@/types'
import { useSubmissionsData, useThreadsData } from '@/hooks'
import { RoomTypeBadge, Button, ConfirmModal } from '@/components/shared'
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  ChatCircleDots, 
  GearSix, 
  Sparkle, 
  Users, 
  Clock, 
  ArrowClockwise, 
  XCircle, 
  PaperPlaneTilt, 
  CheckCircle, 
  Chats, 
  Smiley, 
  ShieldCheck, 
  DownloadSimple, 
  Trash 
} from '@phosphor-icons/react'

export default function ResultsPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const [room, setRoom] = useState<RoomWithQuestions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'Overview' | 'Submissions' | 'Threads' | 'Settings'>('Overview')
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
  const [copied, setCopied] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingRoom, setDeletingRoom] = useState(false)

  const { submissions, refetch: refetchSubmissions } = useSubmissionsData(params.id as string)
  const { threads, refetch: refetchThreads } = useThreadsData(params.id as string)

  useEffect(() => {
    async function loadRoom() {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select(`
            *,
            questions (*)
          `)
          .eq('id', params.id)
          .single()

        if (error) throw error
        setRoom(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadRoom()

    // Realtime subscriptions for submissions, answers, and threads
    const channel = supabase
      .channel(`room-insights:${params.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions', filter: `room_id=eq.${params.id}` }, () => {
        setTimeout(() => refetchSubmissions(), 400)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'answers' }, () => {
        setTimeout(() => refetchSubmissions(), 400)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'threads', filter: `room_id=eq.${params.id}` }, () => {
        refetchThreads()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'thread_messages' }, () => {
        refetchThreads()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [params.id, supabase, refetchSubmissions, refetchThreads])

  const copyRoomLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/r/${params.id}`
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const exportCSV = () => {
    if (!room || submissions.length === 0) return

    const rows: string[][] = [
      ['Submission ID', 'Date', 'Question', 'Response Text', 'Reaction Level (0-100)', 'Intensity']
    ]

    submissions.forEach((s: any, sIdx: number) => {
      const subNumber = `#${submissions.length - sIdx}`
      const date = new Date(s.created_at).toLocaleString()
      
      s.answers?.forEach((a: any) => {
        const qText = room.questions.find(q => q.id === a.question_id)?.text || 'Question'
        rows.push([
          subNumber,
          `"${date}"`,
          `"${qText.replace(/"/g, '""')}"`,
          `"${(a.text || '').replace(/"/g, '""')}"`,
          String(a.reaction_level ?? ''),
          String(a.intensity ?? '')
        ])
      })
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `openly-${room.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-insights.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const closeRoom = async () => {
    try {
      const response = await fetch(`/api/rooms/${params.id}/close`, { method: 'POST' })
      if (response.ok) {
        setRoom(prev => prev ? { ...prev, status: 'closed' } : null)
      }
    } catch (err) {
      console.error('Failed to close room:', err)
    }
  }

  const reopenRoom = async () => {
    try {
      const response = await fetch(`/api/rooms/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'open', closes_at: null }),
      })
      if (response.ok) {
        setRoom(prev => prev ? { ...prev, status: 'open', closes_at: null } : null)
      }
    } catch (err) {
      console.error('Failed to reopen room:', err)
    }
  }

  // Handle starting a thread from a specific submission
  const handleStartThreadForSubmission = async (submissionId: string) => {
    // Check if a thread already exists for this submission
    const existing = threads.find(t => t.submission_id === submissionId)
    if (existing) {
      setSelectedThread(existing)
      return
    }

    try {
      const response = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          roomId: params.id,
        }),
      })

      if (response.ok) {
        const newThread = await response.json()
        newThread.messages = []
        setSelectedThread(newThread)
        refetchThreads()
      }
    } catch (err) {
      console.error('Failed to start thread:', err)
    }
  }

  const handleSendReply = async () => {
    if (!selectedThread || !replyText.trim()) return
    setSendingReply(true)
    try {
      const response = await fetch(`/api/threads/${selectedThread.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'creator',
          text: replyText.trim(),
        }),
      })

      if (response.ok) {
        const newMessage = await response.json()
        setSelectedThread(prev => prev ? {
          ...prev,
          messages: [...(prev.messages || []), newMessage]
        } : null)
        setReplyText('')
        refetchThreads()
      }
    } catch (err) {
      console.error('Failed to send reply:', err)
    } finally {
      setSendingReply(false)
    }
  }

  const handleToggleResolve = async (threadId: string, currentResolved: boolean) => {
    try {
      const response = await fetch(`/api/threads/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_resolved: !currentResolved }),
      })

      if (response.ok) {
        refetchThreads()
        if (selectedThread && selectedThread.id === threadId) {
          setSelectedThread(prev => prev ? { ...prev, is_resolved: !currentResolved } : null)
        }
      }
    } catch (err) {
      console.error('Failed to toggle resolve:', err)
    }
  }

  // Sentiment calculations for Overview tab
  const reactionMetrics = useMemo(() => {
    const allAnswers = submissions.flatMap(s => s.answers || [])
    const reactions = allAnswers
      .map(a => a.reaction_level)
      .filter((r): r is number => r !== null && r !== undefined)

    if (reactions.length === 0) return { avg: 50, label: 'Neutral', fine: 0, moderate: 0, critical: 0 }
    
    const sum = reactions.reduce((acc, r) => acc + r, 0)
    const avg = Math.round(sum / reactions.length)
    const fine = reactions.filter(r => r < 40).length
    const moderate = reactions.filter(r => r >= 40 && r < 75).length
    const critical = reactions.filter(r => r >= 75).length

    const label = avg < 35 ? 'Positive & Calm' : avg < 65 ? 'Moderate / Balanced' : 'Concerning / High Tension'
    return { avg, label, fine, moderate, critical }
  }, [submissions])

  const getBorderColor = (reaction?: number | null) => {
    if (reaction === null || reaction === undefined) return '#ddd5c8'
    if (reaction < 40) return '#7c8c5e'
    if (reaction < 75) return '#d4b071'
    return '#c2674a'
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f0e8] text-muted-foreground">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#c2674a] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-medium text-sm">Gathering room insights…</p>
        </div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f0e8] px-6 text-center">
        <div>
          <h1 className="font-serif text-3xl text-heading">Could not load room</h1>
          <p className="mt-2 text-muted-foreground">{error || 'Room not found'}</p>
          <button onClick={() => router.push('/dashboard')} className="primary-button mt-6">
            ← Return to dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-[#1c1917]">
      {/* Top Header */}
      <header className="border-b border-[#ddd5c8] bg-[#f5f0e8] sticky top-0 z-20 px-4 sm:px-6 py-3.5 sm:py-4 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-heading transition self-start sm:self-auto"
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </button>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {submissions.length > 0 && (
              <button
                onClick={exportCSV}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#ede8dc] border border-[#ddd5c8] rounded-full text-xs font-semibold text-heading hover:bg-[#ddd5c8] transition flex items-center gap-1.5"
                title="Export submissions to CSV"
              >
                <DownloadSimple size={14} />
                <span>Export CSV</span>
              </button>
            )}

            <button
              onClick={copyRoomLink}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-[#ede8dc] border border-[#ddd5c8] rounded-full text-xs font-semibold text-heading hover:bg-[#1c1917] hover:text-[#f5f0e8] transition flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-[#7c8c5e]" />
                  <span>Link Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            {room.status === 'open' ? (
              <button
                onClick={closeRoom}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-[#c0392b] border border-[#c0392b]/30 bg-[#c0392b]/10 rounded-full hover:bg-[#c0392b] hover:text-white transition"
              >
                Close Room
              </button>
            ) : (
              <button
                onClick={reopenRoom}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-[#7c8c5e] border border-[#7c8c5e]/40 bg-[#7c8c5e]/15 rounded-full hover:bg-[#7c8c5e] hover:text-white transition flex items-center gap-1"
              >
                <ArrowClockwise size={13} />
                <span>Reopen</span>
              </button>
            )}

            <RoomTypeBadge type={room.type} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Title Area */}
        <section className="mb-8">
          <p className="eyebrow text-[#c2674a]">Room Insights</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-heading mt-1">
            {room.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {submissions.length} responses · {room.status === 'open' ? 'Open for responses' : 'Closed'}
            {room.closes_at && ` · Closes ${new Date(room.closes_at).toLocaleDateString()}`}
          </p>
        </section>

        {/* Bento Stats Layout */}
        <section className="stats mb-8" aria-label="Room stats summary">
          <div>
            <span className="eyebrow flex items-center gap-1">
              <Users size={14} /> Responses
            </span>
            <b>{submissions.length}</b>
            <small>{room.max_participants ? `${room.max_participants} max allowed` : 'Unlimited capacity'}</small>
          </div>
          <div>
            <span className="eyebrow flex items-center gap-1">
              <Sparkle size={14} /> Average Sentiment
            </span>
            <b>{reactionMetrics.avg}<span className="text-base font-normal">/100</span></b>
            <small className="text-[#c2674a] font-medium">{reactionMetrics.label}</small>
          </div>
          <div>
            <span className="eyebrow flex items-center gap-1">
              <Chats size={14} /> Active Threads
            </span>
            <b>{threads.filter(t => !t.is_resolved).length}</b>
            <small>{threads.length} total discussion threads</small>
          </div>
          <div>
            <span className="eyebrow flex items-center gap-1">
              <Clock size={14} /> Status
            </span>
            <b className="capitalize text-2xl mt-2">{room.status}</b>
            <small>{room.closes_at ? `Closes ${new Date(room.closes_at).toLocaleDateString()}` : 'No deadline'}</small>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-[#ddd5c8] pb-1">
          {(['Overview', 'Submissions', 'Threads', 'Settings'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 rounded-full text-sm font-semibold transition ${
                tab === t
                  ? 'bg-[#1c1917] text-[#f5f0e8]'
                  : 'text-muted-foreground hover:bg-[#ede8dc] hover:text-heading'
              }`}
            >
              {t === 'Threads' ? `Threads (${threads.length})` : t === 'Submissions' ? `Submissions (${submissions.length})` : t}
            </button>
          ))}
        </div>

        {/* 1. OVERVIEW TAB: Sentiment Heatmap and Analytics Charts */}
        {tab === 'Overview' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif text-xl text-heading">Sentiment Spectrum</h3>
                  <p className="text-xs text-muted-foreground">Distribution of emotional weight across all responses</p>
                </div>
                <span className="text-sm font-semibold text-[#c2674a]">{reactionMetrics.avg}/100 Index</span>
              </div>

              {/* Gradient Bar with Marker */}
              <div className="relative my-6">
                <div className="h-4 rounded-full bg-gradient-to-r from-[#7c8c5e] via-[#e2c054] to-[#c2674a]" />
                <div 
                  className="absolute -top-1 w-2.5 h-6 bg-[#1c1917] rounded-full border-2 border-[#f5f0e8] shadow-md -translate-x-1/2 transition-all duration-500"
                  style={{ left: `${Math.min(Math.max(reactionMetrics.avg, 3), 97)}%` }}
                />
              </div>

              <div className="flex justify-between text-xs font-medium text-muted-foreground">
                <span className="text-[#7c8c5e]">Calm / Fine (0)</span>
                <span>Moderate (50)</span>
                <span className="text-[#c2674a]">Concerning (100)</span>
              </div>

              {/* Sentiment Breakdowns */}
              <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-[#ddd5c8] text-center">
                <div className="p-3 bg-[#faf7f2] rounded-xl border border-[#ddd5c8]">
                  <p className="text-xs font-semibold text-[#7c8c5e]">Calm / Fine</p>
                  <b className="font-serif text-2xl text-heading">{reactionMetrics.fine}</b>
                  <small className="block text-xs text-muted-foreground">responses</small>
                </div>
                <div className="p-3 bg-[#faf7f2] rounded-xl border border-[#ddd5c8]">
                  <p className="text-xs font-semibold text-[#8c6c2c]">Moderate</p>
                  <b className="font-serif text-2xl text-heading">{reactionMetrics.moderate}</b>
                  <small className="block text-xs text-muted-foreground">responses</small>
                </div>
                <div className="p-3 bg-[#faf7f2] rounded-xl border border-[#ddd5c8]">
                  <p className="text-xs font-semibold text-[#c2674a]">Urgent / Heavy</p>
                  <b className="font-serif text-2xl text-heading">{reactionMetrics.critical}</b>
                  <small className="block text-xs text-muted-foreground">responses</small>
                </div>
              </div>
            </div>

            {/* Questions Summary */}
            <div className="rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-6 space-y-4">
              <h3 className="font-serif text-xl text-heading">Question Breakdown</h3>
              <div className="space-y-3">
                {room.questions.map((q, i) => (
                  <div key={q.id || i} className="p-4 bg-[#faf7f2] rounded-xl border border-[#ddd5c8] flex items-start gap-3">
                    <span className="flex size-6 items-center justify-center rounded-full bg-[#7c8c5e]/20 text-xs font-bold text-[#7c8c5e] shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-heading">{q.text}</p>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {submissions.filter(s => s.answers?.some(a => a.question_id === q.id && a.text)).length} responses received
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. SUBMISSIONS TAB: Response cards with colored left border & Thread actions */}
        {tab === 'Submissions' && (
          <div className="space-y-4">
            {submissions.length === 0 ? (
              <div className="rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-[#faf7f2] border border-[#ddd5c8] grid place-items-center mx-auto mb-3 text-[#c2674a]">
                  <Chats size={24} />
                </div>
                <h3 className="font-serif text-xl text-heading">No submissions yet</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Share your room link with teammates to start receiving candid anonymous feedback.
                </p>
                <button onClick={copyRoomLink} className="primary-button mt-5 text-xs">
                  {copied ? '✓ Link Copied' : 'Copy Responder Link'}
                </button>
              </div>
            ) : (
              submissions.map((submission: any, sIdx: number) => {
                const thread = threads.find(t => t.submission_id === submission.id)
                return (
                  <div key={submission.id || sIdx} className="rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-6 space-y-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-[#ddd5c8]">
                      <span className="font-semibold text-heading flex items-center gap-1.5">
                        <ShieldCheck size={16} className="text-[#7c8c5e]" />
                        Anonymous Submission #{submissions.length - sIdx}
                      </span>
                      <div className="flex items-center gap-3">
                        <span>{new Date(submission.created_at).toLocaleString()}</span>
                        <button
                          onClick={() => handleStartThreadForSubmission(submission.id)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
                            thread
                              ? 'bg-[#1c1917] text-[#f5f0e8]'
                              : 'bg-[#faf7f2] border border-[#ddd5c8] text-heading hover:bg-[#1c1917] hover:text-[#f5f0e8]'
                          }`}
                        >
                          <ChatCircleDots size={14} />
                          <span>{thread ? `View Thread (${thread.messages?.length || 1})` : 'Ask Clarification'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {submission.answers?.map((answer: any, aIdx: number) => {
                        const borderColor = getBorderColor(answer.reaction_level)
                        return (
                          <div
                            key={answer.id || aIdx}
                            className="p-4 bg-[#faf7f2] rounded-xl border border-[#ddd5c8] shadow-sm"
                            style={{
                              borderLeftWidth: '5px',
                              borderLeftColor: borderColor,
                            }}
                          >
                            {answer.text && (
                              <p className="text-sm text-heading leading-relaxed font-normal">{answer.text}</p>
                            )}

                            <div className="mt-3 pt-2 border-t border-[#ddd5c8]/50 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              {answer.reaction_level !== null && answer.reaction_level !== undefined && (
                                <span className="flex items-center gap-1">
                                  <span className="font-medium text-heading">Reaction:</span>
                                  <span style={{ color: borderColor }} className="font-semibold">
                                    {answer.reaction_level}/100
                                  </span>
                                </span>
                              )}
                              {answer.intensity && (
                                <span className="flex items-center gap-1">
                                  <span className="font-medium text-heading">Weight:</span>
                                  <span className="capitalize text-heading">{answer.intensity}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* 3. THREADS TAB */}
        {tab === 'Threads' && (
          <div className="space-y-4">
            {threads.length === 0 ? (
              <div className="rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-12 text-center">
                <ChatCircleDots size={32} className="text-muted-foreground mx-auto mb-2" />
                <h3 className="font-serif text-xl text-heading">No threads started yet</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  Click &ldquo;Ask Clarification&rdquo; on any submission card to start a 2-way anonymous discussion.
                </p>
              </div>
            ) : (
              threads.map((thread: any) => (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  className={`rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-5 cursor-pointer transition hover:-translate-y-1 hover:shadow-md ${
                    thread.is_resolved ? 'opacity-70' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-heading">
                      {thread.messages?.length || 0} messages
                    </span>
                    <div className="flex gap-2">
                      {thread.is_resolved && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#7c8c5e]/20 text-[#7c8c5e] font-semibold flex items-center gap-1">
                          <CheckCircle size={12} weight="fill" /> Resolved
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-heading">
                    {thread.messages?.[0]?.text || 'Click to view conversation and reply'}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* 4. SETTINGS TAB: Room Details & Management */}
        {tab === 'Settings' && (
          <div className="rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-6 space-y-6">
            <h3 className="font-serif text-2xl text-heading">Room Details & Configuration</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-[#faf7f2] rounded-xl border border-[#ddd5c8]">
                <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Format</span>
                <div className="mt-1"><RoomTypeBadge type={room.type} /></div>
              </div>

              <div className="p-4 bg-[#faf7f2] rounded-xl border border-[#ddd5c8]">
                <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</span>
                <p className="text-sm text-heading mt-1">{room.description || 'No description provided.'}</p>
              </div>

              <div className="p-4 bg-[#faf7f2] rounded-xl border border-[#ddd5c8]">
                <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Public Response URL</span>
                <p className="text-xs font-mono text-[#c2674a] mt-1 break-all select-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/r/${room.id}` : `/r/${room.id}`}
                </p>
              </div>

              <div className="pt-4 border-t border-[#ddd5c8] flex flex-wrap gap-3">
                <Button onClick={() => router.push(`/room/${room.id}`)} variant="secondary">
                  <GearSix size={16} />
                  <span>Edit Room & Questions</span>
                </Button>

                {room.status === 'open' ? (
                  <Button onClick={closeRoom} variant="secondary">
                    <XCircle size={16} />
                    <span>Close Room to Responses</span>
                  </Button>
                ) : (
                  <Button onClick={reopenRoom} variant="secondary">
                    <ArrowClockwise size={16} />
                    <span>Reopen Room</span>
                  </Button>
                )}

                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-[#c0392b] text-white rounded-full text-xs font-semibold hover:bg-[#a93226] transition flex items-center gap-1.5 ml-auto"
                >
                  <Trash size={14} />
                  <span>Delete Room</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Delete Room Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete this room permanently?"
        description={`Are you sure you want to delete "${room?.name}"? All responses, questions, and discussion threads will be permanently erased.`}
        confirmText="Delete Room"
        cancelText="Cancel"
        variant="danger"
        loading={deletingRoom}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          if (!room) return
          setDeletingRoom(true)
          try {
            const res = await fetch(`/api/rooms/${room.id}`, { method: 'DELETE' })
            if (res.ok) {
              router.push('/dashboard')
            }
          } catch (err) {
            console.error(err)
          } finally {
            setDeletingRoom(false)
            setShowDeleteModal(false)
          }
        }}
      />

      {/* Slide-in Thread Panel from Right */}
      {selectedThread && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-full sm:max-w-lg bg-[#f5f0e8] h-full shadow-2xl flex flex-col p-4 sm:p-6 border-l border-[#ddd5c8] overflow-hidden animate-slide-left">
            <div className="flex items-center justify-between pb-4 border-b border-[#ddd5c8]">
              <div>
                <h3 className="font-serif text-xl text-heading">Anonymous Thread</h3>
                <p className="text-xs text-muted-foreground">2-way secure communication with responder</p>
              </div>
              <button 
                onClick={() => setSelectedThread(null)}
                className="p-2 text-muted-foreground hover:text-heading rounded-full hover:bg-[#ede8dc]"
              >
                ✕
              </button>
            </div>

            {/* Thread messages */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {(!selectedThread.messages || selectedThread.messages.length === 0) ? (
                <div className="text-center py-12 text-muted-foreground text-xs">
                  <p className="font-semibold text-heading mb-1">Start a 2-way conversation</p>
                  <p>Ask a clarifying question. The responder will see this when they check their anonymous thread.</p>
                </div>
              ) : (
                selectedThread.messages.map((msg: any, i: number) => {
                  const isCreator = msg.sender === 'creator'
                  return (
                    <div
                      key={msg.id || i}
                      className={`flex flex-col max-w-[85%] rounded-2xl p-4 text-sm ${
                        isCreator
                          ? 'ml-auto bg-[#c2674a] text-[#f5f0e8] rounded-br-none'
                          : 'mr-auto bg-[#ede8dc] border border-[#ddd5c8] text-heading rounded-bl-none'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold opacity-75 mb-1">
                        {isCreator ? 'You (Creator)' : 'Anonymous Responder'}
                      </span>
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                  )
                })
              )}
            </div>

            {/* Resolve button & Input Footer */}
            <div className="pt-3 border-t border-[#ddd5c8] space-y-3">
              <button
                type="button"
                onClick={() => handleToggleResolve(selectedThread.id, !!selectedThread.is_resolved)}
                className="text-xs font-semibold text-[#7c8c5e] hover:underline flex items-center gap-1"
              >
                <CheckCircle size={14} weight="bold" />
                {selectedThread.is_resolved ? 'Mark as Unresolved' : 'Mark as Resolved'}
              </button>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type an anonymous follow-up…"
                  className="flex-1 text-sm rounded-full px-4"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendReply()
                  }}
                />
                <button
                  onClick={handleSendReply}
                  disabled={sendingReply || !replyText.trim()}
                  className="primary-button !px-5 rounded-full"
                >
                  <PaperPlaneTilt size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
