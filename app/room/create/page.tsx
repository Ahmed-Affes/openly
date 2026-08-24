'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RoomType, Question } from '@/types'
import { ROOM_TYPES } from '@/constants'
import { Button, Pill } from '@/components/shared'
import { useUser } from '@/hooks/useUser'

export default function CreateRoomPage() {
  // Don't render during build if env vars are missing
  if (typeof window === 'undefined' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return null
  }

  const router = useRouter()
  const supabase = createClient()
  const { user } = useUser()
  const [selectedType, setSelectedType] = useState<RoomType>('pulse_check')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [closesAt, setClosesAt] = useState('')
  const [questions, setQuestions] = useState<Omit<Question, 'id' | 'created_at'>[]>([
    { room_id: '', text: '', order_index: 0 },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { room_id: '', text: '', order_index: questions.length },
    ])
  }

  const updateQuestion = (index: number, text: string) => {
    const updated = [...questions]
    updated[index].text = text
    setQuestions(updated)
  }

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!user) {
        throw new Error('You must be logged in to create a room')
      }

      const validQuestions = questions
        .filter(q => q.text.trim() !== '')
        .map((q, i) => ({ ...q, order_index: i }))

      if (validQuestions.length === 0) {
        throw new Error('Please add at least one question')
      }

      const roomData = {
        name,
        description,
        type: selectedType,
        status: 'open' as const,
        is_recurring: false,
        closes_at: closesAt ? new Date(closesAt).toISOString() : null,
      }

      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: roomData,
          questions: validQuestions,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create room')
      }

      router.push(`/room/${data.id}/results`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="text-sm text-[#6B6B6B] hover:text-[#2D2D2D] transition-colors"
          >
            ← Back to dashboard
          </button>
        </div>
        <div className="mb-8">
          <Pill>Create something honest</Pill>
          <h1 className="text-3xl font-serif text-[#2D2D2D] mt-4 mb-2">
            Make room <em>for the real stuff.</em>
          </h1>
          <p className="text-[#6B6B6B]">
            Choose a format. Add your questions. We'll take care of the rest.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Type Selection */}
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D] mb-3">
              What kind of room is this?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ROOM_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelectedType(type.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedType === type.value
                      ? 'border-[#8B7355] bg-[#8B7355]/5'
                      : 'border-[#E5E5E5] bg-white hover:border-[#8B7355]/50'
                  }`}
                >
                  <span className="type-icon text-2xl">{type.icon}</span>
                  <div className="mt-2">
                    <strong className="block text-[#2D2D2D]">{type.label}</strong>
                    <small className="text-[#6B6B6B]">{type.description}</small>
                  </div>
                  {selectedType === type.value && (
                    <span className="float-right text-[#8B7355]">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Room Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#2D2D2D] mb-2">
                Room name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg bg-white text-[#2D2D2D] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#8B7355] focus:border-transparent"
                placeholder="e.g. Sprint 12 Retro"
              />
            </div>
            <div>
              <label htmlFor="closesAt" className="block text-sm font-medium text-[#2D2D2D] mb-2">
                Automatic Close date <span className="text-[#6B6B6B] font-normal">(optional)</span>
              </label>
              <input
                id="closesAt"
                type="datetime-local"
                value={closesAt}
                min={typeof window !== 'undefined' ? new Date().toISOString().slice(0, 16) : undefined}
                onChange={(e) => setClosesAt(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg bg-white text-[#2D2D2D] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#8B7355] focus:border-transparent"
              />
              <p className="text-xs text-[#6B6B6B] mt-1">
                Leave blank if you don't want the room to expire automatically.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[#2D2D2D] mb-2">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg bg-white text-[#2D2D2D] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#8B7355] focus:border-transparent"
              placeholder="What is this room about?"
            />
          </div>

          {/* Questions */}
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D] mb-3">
              Questions
            </label>
            {questions.map((question, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={question.text}
                  onChange={(e) => updateQuestion(index, e.target.value)}
                  className="flex-1 px-4 py-3 border border-[#E5E5E5] rounded-lg bg-white text-[#2D2D2D] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#8B7355] focus:border-transparent"
                  placeholder={`Question ${index + 1}`}
                />
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addQuestion}
              className="text-sm text-[#8B7355] hover:underline"
            >
              + Add another question
            </button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E5E5E5]">
            <span className="text-sm text-[#6B6B6B]">✦ Anonymous by design</span>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#2D2D2D] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#3D3D3D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create room →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
