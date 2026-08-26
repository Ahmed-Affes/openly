'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { RoomWithQuestions, Intensity, Thread } from '@/types'
import { getDeviceHash, markAsSubmitted, hasSubmitted } from '@/lib/utils/fingerprint'
import { RoomTypeBadge, Button } from '@/components/shared'
import { 
  ArrowLeft, 
  Check, 
  ShieldCheck, 
  Sparkle,
  Smiley,
  SmileySad,
  SmileyMeh,
  Heart,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  Question,
  Flame,
  PaperPlaneTilt,
  ChatCircleDots
} from '@phosphor-icons/react'

const getFeelingLabel = (n: number) => {
  if (n < 20) return 'Totally fine / Great'
  if (n < 40) return 'Manageable'
  if (n < 60) return 'Somewhere in between'
  if (n < 80) return 'Concerning'
  if (n < 92) return 'Frustrating'
  return 'A critical issue'
}

export default function ResponderPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const [room, setRoom] = useState<RoomWithQuestions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, { text: string; reaction: number; intensity: Intensity; voteChoice?: string }>>({})
  const [mood, setMood] = useState(false)
  const [review, setReview] = useState(false)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Follow-up thread state on Done screen
  const [activeThread, setActiveThread] = useState<any | null>(null)
  const [responderReply, setResponderReply] = useState('')
  const [sendingResponderReply, setSendingResponderReply] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const patch = (field: string, value: any) => {
    setAnswers(a => {
      const prev = a[index] || { text: '', reaction: 50, intensity: 'thought' }
      return { ...a, [index]: { ...prev, [field]: value } }
    })
  }

  // Auto-grow textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    patch('text', e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.max(120, textareaRef.current.scrollHeight)}px`
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const id = params.id as string
        
        let { data } = await supabase
          .from('rooms')
          .select('*, questions (*)')
          .eq('id', id)
          .single()

        if (!data) {
          const r = await fetch(`/api/rooms/${id}`)
          if (!r.ok) throw new Error('This room does not exist.')
          data = await r.json()
        }

        if (data.status !== 'open') throw new Error('This room is closed to new responses.')
        data.questions?.sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
        setRoom(data)

        // Check if user has previously submitted to this room and if a creator thread exists
        if (hasSubmitted(id)) {
          setDone(true)
          const storedSubId = typeof window !== 'undefined' ? localStorage.getItem(`openly_submission_${id}`) : null
          if (storedSubId) {
            checkThreadForSubmission(storedSubId)
          }
        }
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id, supabase])

  const checkThreadForSubmission = async (submissionId: string) => {
    try {
      const { data } = await supabase
        .from('threads')
        .select('*, thread_messages(*)')
        .eq('submission_id', submissionId)
        .single()
      
      if (data) {
        setActiveThread(data)
      }
    } catch {}
  }

  const submit = async () => {
    if (!room) return
    setSubmitting(true)
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id,
          deviceHash: getDeviceHash(),
          answers: room.questions.map((q, i) => ({
            submission_id: '',
            question_id: q.id,
            text: answers[i]?.voteChoice 
              ? `[Choice: ${answers[i]?.voteChoice}] ${answers[i]?.text || ''}`.trim()
              : (answers[i]?.text || null),
            reaction_level: answers[i]?.reaction ?? 50,
            intensity: answers[i]?.intensity || 'thought',
          })),
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not submit')
      
      markAsSubmitted(room.id)
      if (data.submissionId && typeof window !== 'undefined') {
        localStorage.setItem(`openly_submission_${room.id}`, data.submissionId)
      }
      setDone(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const sendResponderMessage = async () => {
    if (!activeThread || !responderReply.trim()) return
    setSendingResponderReply(true)
    try {
      const response = await fetch(`/api/threads/${activeThread.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'responder',
          text: responderReply.trim(),
        }),
      })

      if (response.ok) {
        const newMessage = await response.json()
        setActiveThread((prev: any) => ({
          ...prev,
          messages: [...(prev.messages || []), newMessage]
        }))
        setResponderReply('')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSendingResponderReply(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f0e8] text-muted-foreground">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#c2674a] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-medium text-sm">Preparing a quiet space for your thoughts…</p>
        </div>
      </main>
    )
  }

  if (done) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f5f0e8] px-4 py-12 text-center animate-fade-in">
        <div className="max-w-md w-full">
          <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-[#7c8c5e]/20 text-[#7c8c5e] mx-auto">
            <Check size={40} weight="bold" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-heading">
            {hasSubmitted((params.id as string)) ? "Your thoughts are safely saved." : 'Your voice has been safely heard.'}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Thank you for taking the time to share what is real. Your response is 100% anonymous.
          </p>

          {/* If creator sent a follow-up message */}
          {activeThread && (
            <div className="mt-8 text-left rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#c2674a]">
                <ChatCircleDots size={18} weight="bold" />
                <span>Follow-up from Room Creator</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {activeThread.thread_messages?.map((msg: any, i: number) => {
                  const isCreator = msg.sender === 'creator'
                  return (
                    <div
                      key={msg.id || i}
                      className={`p-3 rounded-xl text-xs leading-relaxed ${
                        isCreator
                          ? 'bg-[#1c1917] text-[#f5f0e8]'
                          : 'bg-[#faf7f2] border border-[#ddd5c8] text-heading'
                      }`}
                    >
                      <span className="block text-[10px] uppercase font-bold opacity-70 mb-0.5">
                        {isCreator ? 'Creator' : 'You (Anonymous)'}
                      </span>
                      <p>{msg.text}</p>
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#ddd5c8]">
                <input
                  type="text"
                  value={responderReply}
                  onChange={(e) => setResponderReply(e.target.value)}
                  placeholder="Reply anonymously…"
                  className="flex-1 text-xs rounded-full px-3 py-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') sendResponderMessage()
                  }}
                />
                <button
                  onClick={sendResponderMessage}
                  disabled={sendingResponderReply || !responderReply.trim()}
                  className="primary-button !px-4 !py-2 text-xs rounded-full"
                >
                  <PaperPlaneTilt size={14} />
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 pt-4">
            <button onClick={() => router.push('/')} className="secondary-button text-xs">
              Openly Home
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (error || !room) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f0e8] px-6 text-center">
        <div>
          <h1 className="font-serif text-3xl text-heading">This room is closed.</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <button onClick={() => router.push('/')} className="primary-button mt-6 text-xs">
            Openly Home
          </button>
        </div>
      </main>
    )
  }

  // Review step
  if (review) {
    return (
      <main className="min-h-screen bg-[#f5f0e8] px-4 py-12">
        <div className="mx-auto max-w-xl animate-fade-in">
          <button onClick={() => setReview(false)} className="mb-8 text-sm font-semibold text-muted-foreground hover:text-heading flex items-center gap-1.5">
            <ArrowLeft size={16} />
            <span>Back to questions</span>
          </button>

          <h1 className="font-serif text-3xl text-heading">Review your thoughts</h1>
          <p className="mt-2 text-xs text-muted-foreground">
            Everything will be submitted with zero identification attached.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {room.questions.map((q, i) => (
              <div key={q.id || i} className="rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-5 space-y-2">
                <span className="text-xs font-bold text-[#c2674a]">Question {i + 1}</span>
                <p className="text-xs font-semibold text-muted-foreground">{q.text}</p>
                <div className="text-sm text-heading font-medium bg-[#faf7f2] p-3 rounded-xl border border-[#ddd5c8]">
                  {answers[i]?.voteChoice && (
                    <span className="inline-block px-2 py-0.5 mb-1.5 rounded-full bg-[#1c1917] text-[#f5f0e8] text-[11px] font-semibold mr-2">
                      Selected: {answers[i]?.voteChoice}
                    </span>
                  )}
                  <p>{answers[i]?.text || <em className="text-muted-foreground">No written commentary provided</em>}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-3 rounded-2xl bg-[#ede8dc] border border-[#ddd5c8] p-4 text-xs text-muted-foreground">
            <ShieldCheck size={24} className="text-[#c2674a] shrink-0" weight="fill" />
            <span>Anonymous by design. No email, IP address, or cookie identifier is stored with your answers.</span>
          </div>

          <button onClick={submit} disabled={submitting} className="primary-button mt-6 w-full text-sm">
            {submitting ? 'Sharing safely…' : 'Share Anonymously →'}
          </button>
        </div>
      </main>
    )
  }

  const q = room.questions[index]
  const a = answers[index] || { text: '', reaction: 50, intensity: 'thought' as Intensity, voteChoice: '' }

  return (
    <main className="min-h-screen bg-[#f5f0e8] px-4 py-8">
      <div className="mx-auto max-w-xl">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <button onClick={() => router.push('/')} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-heading">
            <ArrowLeft size={16} /> Exit
          </button>
          <RoomTypeBadge type={room.type} />
          <span className="text-xs font-medium text-muted-foreground">
            {index + 1} / {room.questions.length}
          </span>
        </header>

        {/* Progress bar */}
        <div className="mt-6 h-1.5 rounded-full bg-[#ddd5c8]">
          <div
            className="h-full rounded-full bg-[#c2674a] transition-all duration-300"
            style={{ width: `${((index + 1) / room.questions.length) * 100}%` }}
          />
        </div>

        {!mood ? (
          <section className="py-20 text-center animate-fade-in">
            <h1 className="font-serif text-3xl sm:text-4xl text-heading">Before you begin…</h1>
            <p className="mt-2 text-sm text-muted-foreground">How are you feeling right now?</p>
            
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
              {[
                { label: 'Calm', icon: <Heart size={24} className="text-[#7c8c5e]" /> },
                { label: 'Good', icon: <Smiley size={24} className="text-[#7c8c5e]" /> },
                { label: 'Uncertain', icon: <SmileyMeh size={24} className="text-[#8c6c2c]" /> },
                { label: 'Frustrated', icon: <SmileySad size={24} className="text-[#c2674a]" /> },
                { label: 'Overloaded', icon: <Sparkle size={24} className="text-[#c2674a]" /> },
              ].map((m) => (
                <button
                  key={m.label}
                  onClick={() => setMood(true)}
                  className="rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-3 sm:p-4 text-xs font-medium text-heading hover:-translate-y-1 hover:border-[#c2674a] transition flex flex-col items-center gap-2"
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            <button onClick={() => setMood(true)} className="mt-8 text-xs text-muted-foreground hover:text-heading underline">
              Skip check-in →
            </button>
          </section>
        ) : (
          <section className="py-8 animate-fade-in space-y-6">
            <div>
              <p className="eyebrow text-[#c2674a]">{room.name}</p>
              <h1 className="mt-2 font-serif text-2xl sm:text-4xl leading-tight text-heading">
                {q.text}
              </h1>
              <p className="mt-2 text-xs text-muted-foreground">
                Your answer is completely anonymous. Take your time.
              </p>
            </div>

            {/* Room-specific: Decision Vote cards */}
            {room.type === 'decision_vote' && (
              <div className="rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-4 sm:p-5 space-y-3">
                <p className="text-xs font-semibold text-heading">Your decision:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { label: 'In Favor / Yes', icon: <ThumbsUp size={16} /> },
                    { label: 'Against / No', icon: <ThumbsDown size={16} /> },
                    { label: 'Needs discussion', icon: <Question size={16} /> },
                  ].map((vote) => (
                    <button
                      key={vote.label}
                      type="button"
                      onClick={() => patch('voteChoice', vote.label)}
                      className={`p-3 rounded-xl text-xs font-semibold flex items-center sm:flex-col justify-center gap-2 transition ${
                        a.voteChoice === vote.label
                          ? 'bg-[#1c1917] text-[#f5f0e8] shadow-sm'
                          : 'bg-[#faf7f2] border border-[#ddd5c8] text-heading hover:border-[#c2674a]'
                      }`}
                    >
                      {vote.icon}
                      <span>{vote.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Auto-growing Textarea */}
            <div>
              <textarea
                ref={textareaRef}
                autoFocus
                value={a.text}
                maxLength={500}
                onChange={handleTextChange}
                rows={4}
                placeholder={room.type === 'decision_vote' ? 'Add rationale or context for your vote…' : 'Say it how you would say it in confidence…'}
                className="w-full text-base min-h-[130px] rounded-2xl"
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">{a.text.length} / 500</p>
            </div>

            {/* Reaction slider: olive -> yellow -> terracotta */}
            <div className="rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-4 sm:p-5 space-y-3">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-heading">How does this feel?</span>
                <span className="text-[#c2674a]">{getFeelingLabel(a.reaction)}</span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={a.reaction}
                onChange={(e) => patch('reaction', Number(e.target.value))}
                className="reaction-range"
              />

              <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
                <span className="text-[#7c8c5e]">Totally fine</span>
                <span className="text-[#c2674a]">A real problem</span>
              </div>
            </div>

            {/* Weight selector */}
            <div className="rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-4 sm:p-5 space-y-3">
              <p className="text-xs font-semibold text-heading">How much weight should we give this?</p>
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                {[
                  { value: 'thought', label: 'Just a thought' },
                  { value: 'urgent', label: 'This is urgent / important' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => patch('intensity', item.value)}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-semibold transition ${
                      a.intensity === item.value
                        ? 'bg-[#1c1917] text-[#f5f0e8] shadow-sm'
                        : 'bg-[#faf7f2] border border-[#ddd5c8] text-heading hover:border-[#c2674a]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-[#ddd5c8] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (index < room.questions.length - 1) setIndex(index + 1)
                  else setReview(true)
                }}
                className="text-xs font-semibold text-[#c2674a] hover:underline"
              >
                Skip question
              </button>

              <button
                type="button"
                disabled={room.type === 'decision_vote' ? !a.voteChoice && !a.text.trim() : !a.text.trim()}
                onClick={() => {
                  if (index < room.questions.length - 1) setIndex(index + 1)
                  else setReview(true)
                }}
                className="primary-button text-xs"
              >
                {index < room.questions.length - 1 ? 'Next Question →' : 'Review & Submit →'}
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
