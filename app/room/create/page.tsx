'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/shared'
import { ROOM_TYPES } from '@/constants'
import { Question, RoomType } from '@/types'

export default function CreateRoomPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<RoomType>('pulse_check')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [closesAt, setClosesAt] = useState('')
  const [questions, setQuestions] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateQuestion = (index: number, text: string) => {
    setQuestions(prev => prev.map((q, i) => (i === index ? text : q)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const validQuestions: Omit<Question, 'id' | 'created_at'>[] = questions
        .map(text => text.trim())
        .filter(text => text !== '')
        .map((text, i) => ({ room_id: '', text, order_index: i }))

      if (validQuestions.length === 0) {
        throw new Error('Add at least one question — it is the heart of the room.')
      }

      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: {
            name,
            description,
            type: selected,
            status: 'open',
            is_recurring: false,
            closes_at: closesAt ? new Date(closesAt).toISOString() : null,
          },
          questions: validQuestions,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create room')

      router.push(`/room/${data.id}/results`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell title="Create">
      <div className="page-content narrow">
        <section className="intro compact-intro">
          <p className="eyebrow accent">Create something honest</p>
          <h2>Make room<br /><em>for the real stuff.</em></h2>
          <p>Choose a format. Add a prompt. We will take care of the rest.</p>
        </section>

        {error && <div className="form-error">{error}</div>}

        <form className="create-form" onSubmit={handleSubmit}>
          <div className="form-progress">
            <span className="active">01</span><i></i><span>02</span><i></i><span>03</span>
            <small>Room details</small>
          </div>

          <label>What kind of room is this?</label>
          <div className="room-types">
            {ROOM_TYPES.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => setSelected(type.value)}
                className={selected === type.value ? 'selected' : ''}
              >
                <span className="type-icon">{type.icon}</span>
                <span><strong>{type.label}</strong><small>{type.description}</small></span>
                {selected === type.value && <b>✓</b>}
              </button>
            ))}
          </div>

          <div className="form-grid">
            <label>
              Room name
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Sprint 12 Retro" />
            </label>
            <label>
              Close date
              <input type="date" value={closesAt} onChange={e => setClosesAt(e.target.value)} />
            </label>
          </div>

          <label>
            Your opening prompt
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What do you want to make space for?"
              rows={4}
            />
          </label>

          <label>Questions</label>
          {questions.map((question, index) => (
            <div className="question-row" key={index}>
              <input
                value={question}
                onChange={e => updateQuestion(index, e.target.value)}
                placeholder={`Question ${index + 1}`}
              />
              {questions.length > 1 && (
                <button type="button" className="remove-question" aria-label="Remove question" onClick={() => setQuestions(prev => prev.filter((_, i) => i !== index))}>×</button>
              )}
            </div>
          ))}
          <button type="button" className="text-button" onClick={() => setQuestions(prev => [...prev, ''])}>+ Add another question</button>

          <div className="form-foot">
            <span>✦ Anonymous by design</span>
            <Button>{loading ? 'Opening the room…' : 'Open the room　→'}</Button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
