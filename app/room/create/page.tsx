'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { RoomType } from '@/types'
import { ROOM_TYPES, CADENCE_OPTIONS } from '@/constants'
import { useUser } from '@/hooks/useUser'
import { RoomTypeBadge, DatePicker, Button } from '@/components/shared'
import { 
  ArrowLeft, 
  Check, 
  DotsSixVertical, 
  Plus, 
  ShieldCheck, 
  Trash,
  Sparkle,
  Pulse,
  ChatCircleDots,
  Question,
  CheckSquareOffset,
  Flame,
  CaretUp,
  CaretDown
} from '@phosphor-icons/react'

export default function CreateRoomPage() {
  const router = useRouter()
  const { user } = useUser()
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState<RoomType>('pulse_check')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [closesAt, setClosesAt] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [cadence, setCadence] = useState('weekly')
  const [maxParticipants, setMaxParticipants] = useState('')
  const [questions, setQuestions] = useState([
    { room_id: '', text: 'What is one thing that went well, and one thing that could be better?', order_index: 0 }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const updateQ = (i: number, text: string) => {
    setQuestions(q => q.map((x, n) => n === i ? { ...x, text } : x))
  }

  const addQ = () => {
    if (questions.length < 10) {
      setQuestions(q => [...q, { room_id: '', text: '', order_index: q.length }])
    }
  }

  const removeQ = (i: number) => {
    if (questions.length > 1) {
      setQuestions(q => q.filter((_, n) => n !== i))
    }
  }

  const moveQ = (from: number, to: number) => {
    if (to < 0 || to >= questions.length) return
    const updated = [...questions]
    const item = updated.splice(from, 1)[0]
    updated.splice(to, 0, item)
    setQuestions(updated)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    const updated = [...questions]
    const item = updated.splice(draggedIndex, 1)[0]
    updated.splice(index, 0, item)
    setDraggedIndex(index)
    setQuestions(updated)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const getFormatIcon = (type: RoomType) => {
    switch (type) {
      case 'pulse_check':
        return <Pulse size={24} weight="duotone" className="text-[#7c8c5e]" />
      case 'open_feedback':
        return <ChatCircleDots size={24} weight="duotone" className="text-[#4a6580]" />
      case 'qa':
        return <Question size={24} weight="duotone" className="text-[#7c5c8c]" />
      case 'decision_vote':
        return <CheckSquareOffset size={24} weight="duotone" className="text-[#8c6c2c]" />
      case 'hot_take':
        return <Flame size={24} weight="duotone" className="text-[#c2674a]" />
      default:
        return <Sparkle size={24} weight="duotone" className="text-[#c2674a]" />
    }
  }

  const next = () => {
    setError('')
    if (step === 1) {
      setStep(2)
    } else if (step === 2) {
      if (!name.trim()) {
        setError('Please give your room a name.')
        return
      }
      setStep(3)
    } else if (step === 3) {
      if (!questions.some(q => q.text.trim())) {
        setError('Add at least one question.')
        return
      }
      setStep(4)
    }
  }

  const submit = async () => {
    setLoading(true)
    try {
      if (!user) throw new Error('You must be logged in to create a room')
      
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: {
            name,
            description,
            type: selectedType,
            status: 'open',
            is_recurring: recurring,
            closes_at: closesAt ? new Date(closesAt).toISOString() : null,
            max_participants: maxParticipants ? Number(maxParticipants) : null,
          },
          questions: questions
            .filter(q => q.text.trim())
            .map((q, i) => ({ ...q, order_index: i })),
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create room')
      router.push(`/room/${data.id}/results`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const stepTitles = [
    'Choose a format',
    'Name your room',
    'Add questions',
    'Review & launch'
  ]

  return (
    <main className="min-h-screen bg-[#f5f0e8] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <button 
          onClick={() => router.push('/dashboard')} 
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-heading transition"
        >
          <ArrowLeft size={16} />
          <span>Back to dashboard</span>
        </button>

        <div className="mb-8">
          <p className="eyebrow text-[#c2674a]">Create something honest</p>
          <h1 className="mt-2 font-serif text-4xl text-heading">Make room <em>for the real stuff.</em></h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Step {step} of 4 — {stepTitles[step - 1]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8 flex items-center gap-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex flex-1 items-center gap-2">
              <div 
                className={`size-3.5 rounded-full transition-colors ${
                  n < step ? 'bg-[#7c8c5e]' : n === step ? 'bg-[#c2674a]' : 'bg-[#ddd5c8]'
                }`}
              />
              {n < 4 && (
                <div 
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    n < step ? 'bg-[#7c8c5e]' : 'bg-[#ddd5c8]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div role="alert" className="mb-6 rounded-2xl border border-[#c0392b]/30 bg-[#c0392b]/10 p-4 text-sm font-medium text-[#c0392b]">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Format */}
          {step === 1 && (
            <motion.section 
              key="step1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <h2 className="font-serif text-2xl text-heading">What kind of room is this?</h2>
                <p className="mt-1 text-sm text-muted-foreground">Each format sets an intentional tone for responses.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {ROOM_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setSelectedType(t.value as RoomType)}
                    className={`relative min-h-36 rounded-2xl border p-5 text-left transition duration-200 hover:-translate-y-1 ${
                      selectedType === t.value
                        ? 'border-2 border-[#c2674a] bg-[#ede8dc] shadow-md'
                        : 'border-[#ddd5c8] bg-[#ede8dc] hover:border-[#c2674a]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="size-10 rounded-xl bg-[#faf7f2] border border-[#ddd5c8] grid place-items-center">
                        {getFormatIcon(t.value as RoomType)}
                      </div>
                      {selectedType === t.value && (
                        <span className="p-1 rounded-full bg-[#c2674a] text-[#f5f0e8]">
                          <Check size={14} weight="bold" />
                        </span>
                      )}
                    </div>
                    <span className="mt-3 block font-serif text-lg font-medium text-heading">{t.label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground leading-relaxed">{t.description}</span>
                  </button>
                ))}
              </div>
            </motion.section>
          )}

          {/* Step 2: Name & Details & Custom Date Picker */}
          {step === 2 && (
            <motion.section 
              key="step2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <h2 className="font-serif text-2xl text-heading">Name & timing</h2>
                <p className="mt-1 text-sm text-muted-foreground">Give your room a clear purpose and optional close date.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-heading mb-1.5">Room title</label>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sprint 14 Retro · What went unsaid?"
                    className="w-full text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-heading mb-1.5">Description (optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add context for your team about what feedback is most valuable..."
                    rows={3}
                    className="w-full text-sm"
                  />
                </div>

                {/* Custom Date Picker */}
                <DatePicker
                  value={closesAt}
                  onChange={setClosesAt}
                  label="Automatic close date (optional)"
                  placeholder="Choose when room closes (default: open indefinitely)"
                />

                <div className="pt-2">
                  <label className="flex items-center justify-between rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-4 cursor-pointer">
                    <div>
                      <strong className="block text-sm text-heading">Recurring room</strong>
                      <small className="text-muted-foreground">Automatically refresh for your team cadence</small>
                    </div>
                    <input
                      type="checkbox"
                      checked={recurring}
                      onChange={(e) => setRecurring(e.target.checked)}
                      className="size-5 accent-[#c2674a]"
                    />
                  </label>
                </div>

                {recurring && (
                  <div className="flex gap-2">
                    {CADENCE_OPTIONS.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setCadence(c)}
                        className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                          cadence === c
                            ? 'bg-[#1c1917] text-[#f5f0e8] border-[#1c1917]'
                            : 'border-[#ddd5c8] bg-[#ede8dc] text-heading'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-heading mb-1.5">
                    Max respondents (optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    placeholder="Unlimited"
                    className="w-full text-sm"
                  />
                </div>
              </div>
            </motion.section>
          )}

          {/* Step 3: Draggable & Reorderable Questions */}
          {step === 3 && (
            <motion.section 
              key="step3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <h2 className="font-serif text-2xl text-heading">What do you want to ask?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your team will answer these questions one at a time in a focused, quiet flow.
                </p>
              </div>

              <div className="space-y-3">
                {questions.map((q, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDragEnd={handleDragEnd}
                    className={`rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-4 transition-all ${
                      draggedIndex === i ? 'opacity-50 border-dashed border-[#c2674a]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col gap-0.5 mt-1">
                        <button
                          type="button"
                          onClick={() => moveQ(i, i - 1)}
                          disabled={i === 0}
                          className="p-1 text-muted-foreground hover:text-heading disabled:opacity-25"
                          title="Move up"
                        >
                          <CaretUp size={14} weight="bold" />
                        </button>
                        <div className="cursor-grab text-muted-foreground hover:text-heading grid place-items-center" title="Drag to reorder">
                          <DotsSixVertical size={16} weight="bold" />
                        </div>
                        <button
                          type="button"
                          onClick={() => moveQ(i, i + 1)}
                          disabled={i === questions.length - 1}
                          className="p-1 text-muted-foreground hover:text-heading disabled:opacity-25"
                          title="Move down"
                        >
                          <CaretDown size={14} weight="bold" />
                        </button>
                      </div>

                      <span className="mt-2.5 flex size-6 items-center justify-center rounded-full bg-[#7c8c5e]/20 text-xs font-bold text-[#7c8c5e] shrink-0">
                        {i + 1}
                      </span>

                      <textarea
                        value={q.text}
                        onChange={(e) => updateQ(i, e.target.value)}
                        maxLength={500}
                        rows={2}
                        placeholder={`Question ${i + 1} prompt...`}
                        className="w-full flex-1 text-sm"
                      />

                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQ(i)}
                          className="mt-2 p-2 text-muted-foreground hover:text-[#c0392b] transition"
                          title="Delete question"
                        >
                          <Trash size={18} />
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-right text-xs text-muted-foreground">{q.text.length} / 500</p>
                  </div>
                ))}
              </div>

              {questions.length < 10 && (
                <button
                  type="button"
                  onClick={addQ}
                  className="inline-flex items-center gap-2 rounded-full border border-[#7c8c5e] px-5 py-2.5 text-sm font-semibold text-[#7c8c5e] hover:bg-[#7c8c5e] hover:text-[#f5f0e8] transition"
                >
                  <Plus size={16} weight="bold" />
                  <span>Add another question</span>
                </button>
              )}
              <p className="text-xs text-muted-foreground">Up to 10 questions per room</p>
            </motion.section>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <motion.section 
              key="step4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <h2 className="font-serif text-2xl text-heading">Ready to open the room?</h2>
                <p className="mt-1 text-sm text-muted-foreground">Review your settings before sharing with your team.</p>
              </div>

              <div className="rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <RoomTypeBadge type={selectedType} />
                  <span className="text-xs text-muted-foreground">Anonymous Room</span>
                </div>

                <div>
                  <h3 className="font-serif text-2xl font-medium text-heading">{name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{description || 'A space for honest reflection.'}</p>
                </div>

                <div className="pt-3 border-t border-[#ddd5c8] grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <div>
                    <span className="block font-medium text-heading">Questions</span>
                    <span>{questions.filter(q => q.text.trim()).length} prompts</span>
                  </div>
                  <div>
                    <span className="block font-medium text-heading">Close date</span>
                    <span>{closesAt ? new Date(closesAt).toLocaleDateString() : 'No closing date'}</span>
                  </div>
                  <div>
                    <span className="block font-medium text-heading">Cadence</span>
                    <span>{recurring ? `Repeats ${cadence}` : 'One-time room'}</span>
                  </div>
                  <div>
                    <span className="block font-medium text-heading">Max respondents</span>
                    <span>{maxParticipants || 'Unlimited'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-[#ede8dc] border border-[#ddd5c8] p-4 text-xs text-muted-foreground">
                <ShieldCheck size={24} className="text-[#c2674a] shrink-0" weight="fill" />
                <span>100% anonymous by design. No responder sign-in required. No IP addresses stored.</span>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="mt-10 flex justify-between items-center border-t border-[#ddd5c8] pt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:text-heading transition"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button onClick={next}>
              Next step →
            </Button>
          ) : (
            <Button onClick={submit} disabled={loading}>
              {loading ? 'Opening room…' : 'Launch room →'}
            </Button>
          )}
        </div>
      </div>
    </main>
  )
}
