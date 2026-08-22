'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/shared'
import { useSubmissionsData, useThreads, useThreadsData } from '@/hooks'
import { RoomWithQuestions, SubmissionWithAnswers, Thread } from '@/types'
import { calculateSafetyScore } from '@/lib/utils/score'
import { formatDateTime } from '@/lib/utils/helpers'

const TABS = ['Overview', 'Submissions', 'Threads', 'Questions']

export default function ResultsPage() {
  const params = useParams()
  const roomId = params.id as string
  const [room, setRoom] = useState<RoomWithQuestions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('Overview')
  const [openThread, setOpenThread] = useState<Thread | null>(null)

  const { submissions, refetch: refetchSubmissions } = useSubmissionsData(roomId)
  const { threads, refetch: refetchThreads } = useThreadsData(roomId)
  const { createThread } = useThreads()

  useEffect(() => {
    const supabase = createClient()

    async function loadRoom() {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*, questions (*)')
          .eq('id', roomId)
          .single()

        if (error) throw error
        setRoom(data as RoomWithQuestions)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadRoom()

    const submissionsChannel = supabase
      .channel(`submissions:${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'submissions', filter: `room_id=eq.${roomId}` }, () => refetchSubmissions())
      .subscribe()

    const threadsChannel = supabase
      .channel(`threads:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'threads', filter: `room_id=eq.${roomId}` }, () => refetchThreads())
      .subscribe()

    return () => {
      supabase.removeChannel(submissionsChannel)
      supabase.removeChannel(threadsChannel)
    }
  }, [roomId, refetchSubmissions, refetchThreads])

  const answers = useMemo(() => submissions.flatMap(s => s.answers || []), [submissions])

  const safety = useMemo(() => {
    if (!room || submissions.length === 0) return null
    return calculateSafetyScore(
      submissions,
      answers,
      threads,
      [],
      room.max_participants || submissions.length,
      room.is_recurring
    )
  }, [room, submissions, answers, threads])

  const reactions = answers.map(a => a.reaction_level).filter((r): r is number => typeof r === 'number')
  const avgReaction = reactions.length > 0 ? Math.round(reactions.reduce((sum, r) => sum + r, 0) / reactions.length) : 50
  const worthExploring = reactions.length > 0
    ? Math.round((reactions.filter(r => r >= 40 && r <= 70).length / reactions.length) * 100)
    : 0
  const responseRate = room?.max_participants ? Math.round((submissions.length / room.max_participants) * 100) : null
  const avgDepth = answers.length > 0
    ? Math.min(5, Math.round((answers.reduce((sum, a) => sum + (a.text?.length || 0), 0) / answers.length / 200) * 5 * 10) / 10)
    : 0
  const openThreads = threads.filter(t => !t.is_resolved)

  const startThread = useCallback(async (submission: SubmissionWithAnswers) => {
    const existing = threads.find(t => t.submission_id === submission.id)
    if (existing) {
      setOpenThread(existing)
      return
    }
    const created = await createThread(submission.id, roomId)
    if (created) {
      await refetchThreads()
      setOpenThread(created)
    }
  }, [threads, createThread, roomId, refetchThreads])

  const closeRoom = async () => {
    const response = await fetch(`/api/rooms/${roomId}/close`, { method: 'POST' })
    if (response.ok) setRoom(prev => (prev ? { ...prev, status: 'closed' } : prev))
  }

  if (loading) {
    return <AppShell title="Results"><div className="page-content"><p className="responder-note">Reading the room…</p></div></AppShell>
  }

  if (error || !room) {
    return <AppShell title="Results"><div className="page-content"><p className="responder-note">{error || 'Room not found'}</p></div></AppShell>
  }

  const firstAnswerText = (submission: SubmissionWithAnswers) =>
    submission.answers?.find(a => a.text)?.text || 'No words shared — only a reaction.'

  return (
    <AppShell title="Results">
      <div className="page-content dashboard">
        <section className="dashboard-head">
          <div>
            <p className="eyebrow accent">Your room insights · {room.name}</p>
            <h2>See what is<br /><em>underneath.</em></h2>
            <p>
              {submissions.length} response{submissions.length === 1 ? '' : 's'}
              {room.max_participants ? ` from ${room.max_participants} invited` : ''} · {room.status}
            </p>
          </div>
          <div className="head-actions">
            <button className="date-stamp">
              OPENED<br /><b>{new Date(room.created_at).getDate()}</b><br />
              {new Date(room.created_at).toLocaleString('en-US', { month: 'short' }).toUpperCase()}
            </button>
            {room.status === 'open' && <Button variant="ghost" onClick={closeRoom}>Close room　↗</Button>}
          </div>
        </section>

        <div className="tabs">
          {TABS.map(x => (
            <button key={x} className={tab === x ? 'active' : ''} onClick={() => setTab(x)}>
              {x === 'Threads' ? `Threads (${threads.length})` : x}
            </button>
          ))}
        </div>

        <div className="stats">
          <div>
            <span>Response rate</span>
            <b>{responseRate !== null ? `${responseRate}%` : submissions.length}</b>
            <small>{responseRate !== null ? `${submissions.length} of ${room.max_participants}` : 'responses so far'}</small>
          </div>
          <div>
            <span>Safety score</span>
            <b>{safety ? safety.score : '—'}</b>
            <small className={safety?.trend === 'up' ? 'up' : ''}>{safety ? `${safety.trend === 'stable' ? 'Holding steady' : `${safety.trendPoints > 0 ? '↑' : '↓'} ${Math.abs(safety.trendPoints)} points`}` : 'Waiting for answers'}</small>
          </div>
          <div>
            <span>Avg. depth</span>
            <b>{avgDepth}<span>/5</span></b>
            <small>Across {answers.length} answer{answers.length === 1 ? '' : 's'}</small>
          </div>
          <div>
            <span>Open threads</span>
            <b>{openThreads.length}</b>
            <small>{threads.length} in total</small>
          </div>
        </div>

        {tab === 'Overview' && (
          <>
            <div className="analytics-grid">
              <article className="analytics-card sentiment">
                <div className="card-heading">
                  <div>
                    <p className="eyebrow">Sentiment spectrum</p>
                    <h3>Where the room is landing</h3>
                  </div>
                </div>
                <div className="spectrum">
                  <span className="spectrum-marker" style={{ left: `${avgReaction}%` }}></span>
                  <div className="spectrum-bar"></div>
                  <div className="spectrum-labels">
                    <span>Totally fine</span><span>Something is off</span><span>A real problem</span>
                  </div>
                </div>
                <p className="chart-note"><strong>{worthExploring}%</strong> of responses are in the “worth exploring” range</p>
              </article>

              <article className="analytics-card safety-card">
                <p className="eyebrow">Trust signal</p>
                <div className="score-row">
                  <strong>{safety ? safety.score : '—'}</strong><span>/ 100</span>
                  <div className="score-ring">{safety ? safety.score : '—'}</div>
                </div>
                <p>{safety ? safety.explanation : 'The score appears once people start answering.'}</p>
              </article>
            </div>

            <div className="lower-grid">
              <article className="analytics-card submissions">
                <div className="card-heading">
                  <div>
                    <p className="eyebrow">The pulse of the room</p>
                    <h3>Recent submissions</h3>
                  </div>
                  <button className="text-button" onClick={() => setTab('Submissions')}>View all →</button>
                </div>
                {submissions.length === 0 ? (
                  <p className="chart-note">Nothing yet. Share the room link to start collecting responses.</p>
                ) : (
                  submissions.slice(0, 4).map((submission, i) => (
                    <div className="submission" key={submission.id}>
                      <span className={`avatar ${i % 2 === 0 ? 'avatar-soft' : 'avatar-peach'}`}>AN</span>
                      <div>
                        <p>“{firstAnswerText(submission)}”</p>
                        <small>Anonymous · {formatDateTime(submission.created_at)}</small>
                      </div>
                      <button onClick={() => startThread(submission)} aria-label="Open thread">↗</button>
                    </div>
                  ))
                )}
              </article>

              <article className="analytics-card thread-list-card">
                <div className="card-heading">
                  <div>
                    <p className="eyebrow">Needs your voice</p>
                    <h3>Open threads <span>{openThreads.length}</span></h3>
                  </div>
                  <button className="text-button" onClick={() => setTab('Threads')}>See all →</button>
                </div>
                {threads.length === 0 ? (
                  <p className="chart-note">No threads yet. Reply to a submission to start one.</p>
                ) : (
                  threads.slice(0, 4).map(thread => (
                    <button className="thread-row" key={thread.id} onClick={() => setOpenThread(thread)}>
                      <span className="thread-avatar">AN</span>
                      <span>
                        <strong>{thread.messages?.[0]?.text || 'Can you tell me more about this?'}</strong>
                        <small>{thread.messages?.length || 0} replies · {formatDateTime(thread.created_at)}</small>
                      </span>
                      <b>→</b>
                    </button>
                  ))
                )}
              </article>
            </div>
          </>
        )}

        {tab === 'Submissions' && (
          <article className="analytics-card submissions">
            {submissions.length === 0 ? (
              <p className="chart-note">No submissions yet.</p>
            ) : (
              submissions.map((submission, i) => (
                <div className="submission" key={submission.id}>
                  <span className={`avatar ${i % 2 === 0 ? 'avatar-soft' : 'avatar-peach'}`}>AN</span>
                  <div>
                    {(submission.answers || []).map(answer => (
                      <p key={answer.id}>“{answer.text || 'No words — only a reaction.'}”</p>
                    ))}
                    <small>
                      Anonymous · {(submission.answers || []).some(a => a.intensity === 'urgent') ? 'This is urgent' : 'Just a thought'} · {formatDateTime(submission.created_at)}
                    </small>
                  </div>
                  <button onClick={() => startThread(submission)} aria-label="Open thread">↗</button>
                </div>
              ))
            )}
          </article>
        )}

        {tab === 'Threads' && (
          <article className="analytics-card thread-list-card">
            {threads.length === 0 ? (
              <p className="chart-note">No threads yet.</p>
            ) : (
              threads.map(thread => (
                <button className="thread-row" key={thread.id} onClick={() => setOpenThread(thread)}>
                  <span className="thread-avatar">AN</span>
                  <span>
                    <strong>{thread.messages?.[0]?.text || 'Can you tell me more about this?'}</strong>
                    <small>{thread.messages?.length || 0} replies · {thread.is_resolved ? 'Resolved' : 'Open'} · {formatDateTime(thread.created_at)}</small>
                  </span>
                  <b>→</b>
                </button>
              ))
            )}
          </article>
        )}

        {tab === 'Questions' && (
          <article className="analytics-card">
            <div className="card-heading">
              <div>
                <p className="eyebrow">What you asked</p>
                <h3>Questions in this room</h3>
              </div>
            </div>
            {[...room.questions].sort((a, b) => a.order_index - b.order_index).map((question, i) => (
              <div className="submission" key={question.id}>
                <span className="avatar avatar-soft">0{i + 1}</span>
                <div><p>{question.text}</p></div>
              </div>
            ))}
          </article>
        )}

        {openThread && (
          <ThreadPanel
            thread={openThread}
            close={() => setOpenThread(null)}
            onChange={async () => {
              await refetchThreads()
            }}
          />
        )}
      </div>
    </AppShell>
  )
}

function ThreadPanel({ thread, close, onChange }: { thread: Thread; close: () => void; onChange: () => Promise<void> }) {
  const { addMessage, resolveThread, fetchThread } = useThreads()
  const [current, setCurrent] = useState<Thread>(thread)
  const [reply, setReply] = useState('')

  useEffect(() => { setCurrent(thread) }, [thread])

  const messages = [...(current.messages || [])].sort((a, b) => a.created_at.localeCompare(b.created_at))

  const send = async () => {
    if (!reply.trim()) return
    await addMessage(current.id, 'creator', reply.trim())
    setReply('')
    const refreshed = await fetchThread(current.id)
    if (refreshed) setCurrent(refreshed)
    await onChange()
  }

  const resolve = async () => {
    await resolveThread(current.id, !current.is_resolved)
    setCurrent(prev => ({ ...prev, is_resolved: !prev.is_resolved }))
    await onChange()
  }

  return (
    <div className="thread-panel">
      <div className="thread-header">
        <span>
          <p className="eyebrow">Anonymous thread · {messages.length} replies</p>
          <h3>{messages[0]?.text || 'Can you tell me more about this?'}</h3>
        </span>
        <button onClick={close} className="close">×</button>
      </div>
      <div className="thread-body">
        {messages.length === 0 && <p className="chart-note">No replies yet. Ask something gentle.</p>}
        {messages.map(message => (
          <div className={`thread-message ${message.sender === 'creator' ? 'creator' : ''}`} key={message.id}>
            <span className={`avatar ${message.sender === 'creator' ? 'terracotta' : 'avatar-soft'}`}>
              {message.sender === 'creator' ? 'YOU' : 'AN'}
            </span>
            <div>
              <p>{message.text}</p>
              <small>{message.sender === 'creator' ? 'You' : 'Anonymous'} · {formatDateTime(message.created_at)}</small>
            </div>
          </div>
        ))}
      </div>
      <div className="thread-footer">
        <input
          value={reply}
          onChange={e => setReply(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send() }}
          placeholder="Reply with care..."
        />
        <Button onClick={send}>Send　→</Button>
        <button className="resolve" onClick={resolve}>{current.is_resolved ? '↺ Reopen thread' : '✓ Mark resolved'}</button>
      </div>
    </div>
  )
}
