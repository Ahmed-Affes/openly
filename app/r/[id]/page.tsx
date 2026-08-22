'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Pill } from '@/components/shared'
import { Answer, Intensity, RoomWithQuestions } from '@/types'
import { getDeviceHash, hasSubmitted, markAsSubmitted } from '@/lib/utils/fingerprint'
import { roomTypeLabel } from '@/constants'

type DraftAnswer = { text: string; reaction: number; intensity: Intensity }

const EMPTY_ANSWER: DraftAnswer = { text: '', reaction: 50, intensity: 'thought' }

export default function ResponderPage() {
  const router = useRouter()
  const params = useParams()
  const roomId = params.id as string
  const [room, setRoom] = useState<RoomWithQuestions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, DraftAnswer>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      try {
        if (hasSubmitted(roomId)) {
          setDone(true)
          return
        }

        const { data, error } = await supabase
          .from('rooms')
          .select('*, questions (*)')
          .eq('id', roomId)
          .single()

        if (error) throw error

        if (data.status !== 'open') setError('This room is closed.')
        else if (data.closes_at && new Date(data.closes_at) < new Date()) setError('This room has closed.')
        else setRoom(data as RoomWithQuestions)
      } catch (err: any) {
        setError(err.message || 'Room not found')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [roomId])

  const current = answers[step] || EMPTY_ANSWER
  const setCurrent = (patch: Partial<DraftAnswer>) =>
    setAnswers(prev => ({ ...prev, [step]: { ...EMPTY_ANSWER, ...prev[step], ...patch } }))

  const submit = async () => {
    if (!room) return
    setSubmitting(true)
    setError('')

    try {
      const payload: Omit<Answer, 'id' | 'created_at'>[] = room.questions.map((q, i) => ({
        submission_id: '',
        question_id: q.id,
        text: answers[i]?.text || null,
        reaction_level: answers[i]?.reaction ?? null,
        intensity: answers[i]?.intensity || null,
      }))

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, answers: payload, deviceHash: getDeviceHash() }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to submit')

      markAsSubmitted(room.id)
      setDone(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="responder"><p className="responder-note">Opening the room…</p></div>
  }

  if (done || error || !room) {
    return (
      <div className="responder">
        <p className="eyebrow accent">openly</p>
        <h2>{done ? <>Thank you for<br /><em>saying it.</em></> : <>This room is<br /><em>not open.</em></>}</h2>
        <p className="responder-note">
          {done ? 'Your answer is anonymous and already in the room.' : error || 'This room could not be found.'}
        </p>
        <Button onClick={() => router.push('/explore')}>Explore other rooms　→</Button>
      </div>
    )
  }

  if (room.questions.length === 0) {
    return (
      <div className="responder">
        <h2>Nothing to<br /><em>answer yet.</em></h2>
        <p className="responder-note">This room has no questions.</p>
      </div>
    )
  }

  const questions = [...room.questions].sort((a, b) => a.order_index - b.order_index)
  const question = questions[step]
  const isLast = step === questions.length - 1

  return (
    <div className="responder">
      <div className="responder-top">
        <button onClick={() => router.push('/explore')}>← Leave room</button>
        <span><Pill>{roomTypeLabel(room.type)}</Pill> <small>Question {step + 1} of {questions.length}</small></span>
        <span>•••</span>
      </div>

      <div className="stepper">
        {questions.map((q, i) => (
          <span key={q.id} className={i < step ? 'done' : i === step ? 'current' : ''}>
            {i < step ? '✓' : `0${i + 1}`}
          </span>
        ))}
      </div>

      <p className="eyebrow accent">{room.name}</p>
      <h2>{question.text}</h2>
      <p className="responder-note">Your answer is anonymous. Take your time.</p>

      <textarea
        value={current.text}
        onChange={e => setCurrent({ text: e.target.value })}
        placeholder="Say it how you would say it to a friend..."
        rows={5}
      />

      <div className="reaction">
        <div>
          <strong>How does this feel?</strong>
          <span>{current.reaction < 40 ? 'Totally fine' : current.reaction > 70 ? 'A real problem' : 'Somewhere in between'}</span>
        </div>
        <input type="range" min="0" max="100" value={current.reaction} onChange={e => setCurrent({ reaction: Number(e.target.value) })} />
        <div className="range-labels"><span>Totally fine</span><span>A real problem</span></div>
      </div>

      <div className="intensity">
        <strong>How much weight should we give this?</strong>
        <div>
          {(['thought', 'urgent'] as Intensity[]).map(value => (
            <button
              key={value}
              className={current.intensity === value ? 'selected' : ''}
              onClick={() => setCurrent({ intensity: value })}
            >
              {value === 'thought' ? 'Just a thought' : 'This is urgent'}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <Button className="share-button" onClick={() => (isLast ? submit() : setStep(step + 1))}>
        {isLast ? (submitting ? 'Sharing…' : 'Share anonymously　→') : 'Next question　→'}
      </Button>
      {step > 0 && <button className="skip" onClick={() => setStep(step - 1)}>← Back to the last question</button>}
    </div>
  )
}
