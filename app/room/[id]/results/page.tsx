'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RoomWithQuestions, SubmissionWithAnswers, Thread } from '@/types'
import { useSubmissionsData, useThreadsData } from '@/hooks'
import { Pill } from '@/components/shared'

export default function ResultsPage() {
  // Don't render during build if env vars are missing
  if (typeof window === 'undefined' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return null
  }

  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const [room, setRoom] = useState<RoomWithQuestions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('Overview')
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null)

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

    // Set up realtime subscriptions
    const submissionsChannel = supabase
      .channel(`submissions:${params.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'submissions',
          filter: `room_id=eq.${params.id}`,
        },
        () => {
          refetchSubmissions()
        }
      )
      .subscribe()

    const threadsChannel = supabase
      .channel(`threads:${params.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'threads',
          filter: `room_id=eq.${params.id}`,
        },
        () => {
          refetchThreads()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(submissionsChannel)
      supabase.removeChannel(threadsChannel)
    }
  }, [params.id, supabase, refetchSubmissions, refetchThreads])

  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyRoomLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/r/${params.id}`
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const closeRoom = async () => {
    try {
      const response = await fetch(`/api/rooms/${params.id}/close`, {
        method: 'POST',
      })

      if (response.ok) {
        setRoom(prev => prev ? { ...prev, status: 'closed' } : null)
      }
    } catch (err) {
      console.error('Failed to close room:', err)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <div className="text-[#6B6B6B]">Loading results...</div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <div className="text-[#6B6B6B]">{error || 'Room not found'}</div>
      </div>
    )
  }

  const responseRate = room.max_participants 
    ? Math.round((submissions.length / room.max_participants) * 100)
    : 0

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E5] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-[#6B6B6B] hover:text-[#2D2D2D] text-sm"
          >
            ← Back to dashboard
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={copyRoomLink}
              className="px-3 py-1.5 text-sm border border-[#E5E5E5] bg-white rounded-lg hover:border-[#8B7355] text-[#2D2D2D] transition-colors"
            >
              {copied ? '✓ Link Copied' : '🔗 Copy Room Link'}
            </button>
            {room.status === 'open' && (
              <button
                onClick={closeRoom}
                className="px-3 py-1.5 text-sm text-[#6B6B6B] hover:text-[#2D2D2D] border border-[#E5E5E5] rounded-lg hover:border-[#8B7355] transition-colors"
              >
                Close room
              </button>
            )}
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              room.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {room.status}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Room Header */}
        <section className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow text-[#8B7355]">Your room insights · {room.name}</p>
              <h1 className="text-3xl font-serif text-[#2D2D2D] mt-2">
                See what is <em>underneath.</em>
              </h1>
              <p className="text-[#6B6B6B] mt-2">
                {submissions.length} responses · Updated just now
              </p>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-[#E5E5E5]">
          {['Overview', 'Submissions', 'Threads', 'Settings'].map((t: string) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                tab === t
                  ? 'text-[#8B7355] border-b-2 border-[#8B7355]'
                  : 'text-[#6B6B6B] hover:text-[#2D2D2D]'
              }`}
            >
              {t === 'Threads' ? `Threads (${threads.length})` : t}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
            <span className="text-sm text-[#6B6B6B]">Response rate</span>
            <b className="block text-2xl text-[#2D2D2D] mt-1">{responseRate}%</b>
            <small className="text-green-600">{submissions.length} responses</small>
          </div>
          <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
            <span className="text-sm text-[#6B6B6B]">Questions</span>
            <b className="block text-2xl text-[#2D2D2D] mt-1">{room.questions.length}</b>
            <small className="text-[#6B6B6B]">In this room</small>
          </div>
          <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
            <span className="text-sm text-[#6B6B6B]">Open threads</span>
            <b className="block text-2xl text-[#2D2D2D] mt-1">{threads.filter(t => !t.is_resolved).length}</b>
            <small className="text-[#6B6B6B]">Need attention</small>
          </div>
          <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
            <span className="text-sm text-[#6B6B6B]">Status</span>
            <b className="block text-2xl text-[#2D2D2D] mt-1 capitalize">{room.status}</b>
            <small className="text-[#6B6B6B]">{room.closes_at ? `Closes ${new Date(room.closes_at).toLocaleDateString()}` : 'No deadline'}</small>
          </div>
        </div>

        {/* Tab Content */}
        {tab === 'Overview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
              <h3 className="text-lg font-serif text-[#2D2D2D] mb-4">Room Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-[#6B6B6B]">Type</span>
                  <div className="mt-1"><Pill>{room.type}</Pill></div>
                </div>
                <div>
                  <span className="text-sm text-[#6B6B6B]">Description</span>
                  <p className="text-[#2D2D2D]">{room.description || 'No description'}</p>
                </div>
                <div>
                  <span className="text-sm text-[#6B6B6B]">Public Response Link</span>
                  <p className="text-[#8B7355] text-sm break-all font-mono mt-1">
                    {typeof window !== 'undefined' ? `${window.location.origin}/r/${room.id}` : `/r/${room.id}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
              <h3 className="text-lg font-serif text-[#2D2D2D] mb-4">Questions</h3>
              <div className="space-y-4">
                {room.questions.map((q: any, i: number) => (
                  <div key={q.id || i} className="p-4 bg-[#FAF8F5] rounded-lg">
                    <span className="text-sm text-[#8B7355]">Question {i + 1}</span>
                    <p className="text-[#2D2D2D] mt-1">{q.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'Submissions' && (
          <div className="space-y-4">
            {submissions.length === 0 ? (
              <div className="bg-white rounded-lg border border-[#E5E5E5] p-12 text-center">
                <p className="text-[#6B6B6B]">No submissions yet</p>
                <p className="text-sm text-[#6B6B6B] mt-2">Share the room link to start collecting responses</p>
                <button
                  onClick={copyRoomLink}
                  className="mt-4 bg-[#2D2D2D] text-white px-4 py-2 rounded-lg text-sm"
                >
                  {copied ? '✓ Link Copied' : 'Copy Room Link'}
                </button>
              </div>
            ) : (
              submissions.map((submission: any) => (
                <div key={submission.id} className="bg-white rounded-lg border border-[#E5E5E5] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-[#6B6B6B]">Anonymous response</span>
                    <span className="text-sm text-[#6B6B6B]">
                      {new Date(submission.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {submission.answers?.map((answer: any) => (
                      <div key={answer.id} className="p-4 bg-[#FAF8F5] rounded-lg">
                        {answer.text && <p className="text-[#2D2D2D]">{answer.text}</p>}
                        {answer.reaction_level !== null && answer.reaction_level !== undefined && (
                          <div className="mt-2">
                            <span className="text-sm text-[#6B6B6B]">Reaction: </span>
                            <span className="text-[#2D2D2D]">{answer.reaction_level}/100</span>
                          </div>
                        )}
                        {answer.intensity && (
                          <div className="mt-2">
                            <span className="text-sm text-[#6B6B6B]">Intensity: </span>
                            <span className="text-[#2D2D2D] capitalize">{answer.intensity}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'Threads' && (
          <div className="space-y-4">
            {threads.length === 0 ? (
              <div className="bg-white rounded-lg border border-[#E5E5E5] p-12 text-center">
                <p className="text-[#6B6B6B]">No threads yet</p>
                <p className="text-sm text-[#6B6B6B] mt-1">Threads allow creators and anonymous responders to converse safely.</p>
              </div>
            ) : (
              threads.map((thread: any) => (
                <div
                  key={thread.id}
                  className={`bg-white rounded-lg border border-[#E5E5E5] p-6 cursor-pointer hover:shadow-lg transition-shadow ${
                    thread.is_resolved ? 'opacity-60' : ''
                  }`}
                  onClick={() => setSelectedThread(thread)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#6B6B6B]">
                      {thread.messages?.length || 0} messages
                    </span>
                    <div className="flex gap-2">
                      {thread.is_pinned && <span className="text-sm text-[#8B7355]">📌 Pinned</span>}
                      {thread.is_resolved && <span className="text-sm text-green-600">✓ Resolved</span>}
                    </div>
                  </div>
                  <p className="text-[#2D2D2D]">
                    {thread.messages?.[0]?.text || 'No messages yet'}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'Settings' && (
          <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
            <h3 className="text-lg font-serif text-[#2D2D2D] mb-4">Room Settings</h3>
            <div className="space-y-4">
              <button
                onClick={() => router.push(`/room/${room.id}`)}
                className="w-full text-left px-4 py-3 hover:bg-[#FAF8F5] rounded-lg transition-colors border border-[#E5E5E5]"
              >
                <strong className="text-[#2D2D2D]">Room details</strong>
                <p className="text-sm text-[#6B6B6B]">View questions and configuration</p>
              </button>
              <button
                onClick={closeRoom}
                disabled={room.status === 'closed'}
                className="w-full text-left px-4 py-3 hover:bg-[#FAF8F5] rounded-lg transition-colors border border-[#E5E5E5] disabled:opacity-50"
              >
                <strong className="text-[#2D2D2D]">Close room</strong>
                <p className="text-sm text-[#6B6B6B]">
                  {room.status === 'closed' ? 'Room is already closed' : 'Stop accepting new responses'}
                </p>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Thread Panel Modal */}
      {selectedThread && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[#E5E5E5] flex items-center justify-between">
              <div>
                <p className="eyebrow text-[#8B7355]">Anonymous thread</p>
                <h3 className="text-lg font-serif text-[#2D2D2D]">
                  {selectedThread.messages?.length || 0} messages
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleResolve(selectedThread.id, selectedThread.is_resolved)}
                  className="text-xs px-2.5 py-1 rounded border border-[#E5E5E5] hover:border-[#8B7355] text-[#6B6B6B]"
                >
                  {selectedThread.is_resolved ? 'Reopen' : 'Mark Resolved'}
                </button>
                <button
                  onClick={() => setSelectedThread(null)}
                  className="text-2xl text-[#6B6B6B] hover:text-[#2D2D2D]"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 max-h-[50vh] space-y-4">
              {(!selectedThread.messages || selectedThread.messages.length === 0) ? (
                <p className="text-[#6B6B6B] text-sm text-center py-6">No messages in this thread yet</p>
              ) : (
                selectedThread.messages.map((message: any) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      message.sender === 'creator' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.sender !== 'creator' && (
                      <span className="w-8 h-8 rounded-full bg-[#E5E5E5] text-[#6B6B6B] flex items-center justify-center text-xs shrink-0 font-medium">
                        AN
                      </span>
                    )}
                    <div className={`p-3 rounded-lg max-w-[80%] ${
                      message.sender === 'creator' ? 'bg-[#8B7355] text-white' : 'bg-[#FAF8F5] text-[#2D2D2D]'
                    }`}>
                      <p className="text-sm">{message.text}</p>
                      <small className={`block text-[10px] mt-1 ${message.sender === 'creator' ? 'text-white/70' : 'text-[#9CA3AF]'}`}>
                        {message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </small>
                    </div>
                    {message.sender === 'creator' && (
                      <span className="w-8 h-8 rounded-full bg-[#8B7355] text-white flex items-center justify-center text-xs shrink-0 font-medium">
                        You
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendReply()
              }}
              className="p-4 border-t border-[#E5E5E5] bg-white flex gap-2"
            >
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Reply with care..."
                className="flex-1 px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355] text-sm"
              />
              <button
                type="submit"
                disabled={sendingReply || !replyText.trim()}
                className="px-4 py-2 bg-[#2D2D2D] text-white rounded-lg text-sm hover:bg-[#3D3D3D] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingReply ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
