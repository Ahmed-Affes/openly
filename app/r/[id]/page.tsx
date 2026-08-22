'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RoomWithQuestions, Answer, Intensity } from '@/types'
import { getDeviceHash, markAsSubmitted, hasSubmitted } from '@/lib/utils/fingerprint'
import { Pill } from '@/components/shared'

export default function ResponderPage() {
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, { text: string; reaction: number; intensity: Intensity }>>({})
  const [submitting, setSubmitting] = useState(false)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)

  useEffect(() => {
    async function loadRoom() {
      try {
        const roomId = params.id as string
        
        // Check if already submitted
        if (hasSubmitted(roomId)) {
          setAlreadySubmitted(true)
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('rooms')
          .select(`
            *,
            questions (*)
          `)
          .eq('id', roomId)
          .single()

        if (error) throw error

        // Check if room is open
        if (data.status !== 'open') {
          setError('This room is closed')
        } else if (data.closes_at && new Date(data.closes_at) < new Date()) {
          setError('This room has closed')
        } else {
          setRoom(data)
        }
      } catch (err: any) {
        setError(err.message || 'Room not found')
      } finally {
        setLoading(false)
      }
    }

    loadRoom()
  }, [params.id, supabase])

  const handleAnswerChange = (questionIndex: number, field: 'text' | 'reaction' | 'intensity', value: string | number) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: {
        ...prev[questionIndex],
        [field]: value,
      },
    }))
  }

  const handleSubmit = async () => {
    if (!room) return

    setSubmitting(true)
    setError('')

    try {
      const deviceHash = getDeviceHash()
      
      const answersArray: Omit<Answer, 'id' | 'created_at'>[] = room.questions.map((q, i) => ({
        submission_id: '', // Will be set by API
        question_id: q.id,
        text: answers[i]?.text || null,
        reaction_level: answers[i]?.reaction || null,
        intensity: answers[i]?.intensity || null,
      }))

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id,
          answers: answersArray,
          deviceHash,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit')
      }

      markAsSubmitted(room.id)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <div className="text-[#6B6B6B]">Loading room...</div>
      </div>
    )
  }

  if (error || alreadySubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-serif text-[#2D2D2D] mb-4">
            {alreadySubmitted ? 'Already submitted' : 'Room not available'}
          </h1>
          <p className="text-[#6B6B6B] mb-6">
            {alreadySubmitted 
              ? 'You have already submitted to this room.' 
              : error || 'This room could not be found or is not currently open.'}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[#2D2D2D] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#3D3D3D] transition-colors"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!room || room.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <div className="text-[#6B6B6B]">No questions found for this room</div>
      </div>
    )
  }

  const currentQuestion = room.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / room.questions.length) * 100

  return (
    <div className="min-h-screen bg-[#FAF8F5] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="text-[#6B6B6B] hover:text-[#2D2D2D]"
          >
            ← Leave room
          </button>
          <div className="flex items-center gap-2">
            <Pill>{room.type}</Pill>
            <small className="text-[#6B6B6B]">Question {currentQuestionIndex + 1} of {room.questions.length}</small>
          </div>
          <div className="text-[#6B6B6B]">•••</div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            {room.questions.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded ${
                  i < currentQuestionIndex ? 'bg-[#8B7355]' :
                  i === currentQuestionIndex ? 'bg-[#8B7355]' :
                  'bg-[#E5E5E5]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <p className="eyebrow text-[#8B7355] mb-2">{room.name}</p>
          <h2 className="text-2xl font-serif text-[#2D2D2D] mb-4">
            {currentQuestion.text}
          </h2>
          <p className="text-[#6B6B6B]">Your answer is anonymous. Take your time.</p>
        </div>

        {/* Answer Form */}
        <div className="space-y-6">
          <div>
            <textarea
              value={answers[currentQuestionIndex]?.text || ''}
              onChange={(e) => handleAnswerChange(currentQuestionIndex, 'text', e.target.value)}
              placeholder="Say it how you would say it to a friend..."
              rows={5}
              className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg bg-white text-[#2D2D2D] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#8B7355] focus:border-transparent"
            />
          </div>

          {/* Reaction Slider */}
          <div className="reaction">
            <div className="flex justify-between mb-2">
              <strong className="text-[#2D2D2D]">How does this feel?</strong>
              <span className="text-[#6B6B6B]">
                {answers[currentQuestionIndex]?.reaction < 40 ? 'Totally fine' :
                 answers[currentQuestionIndex]?.reaction > 70 ? 'A real problem' :
                 'Somewhere in between'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={answers[currentQuestionIndex]?.reaction || 50}
              onChange={(e) => handleAnswerChange(currentQuestionIndex, 'reaction', Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-[#6B6B6B] mt-2">
              <span>Totally fine</span>
              <span>A real problem</span>
            </div>
          </div>

          {/* Intensity */}
          <div className="intensity">
            <strong className="block text-[#2D2D2D] mb-3">How much weight should we give this?</strong>
            <div className="flex gap-3">
              {['thought', 'urgent'].map((intensity) => (
                <button
                  key={intensity}
                  type="button"
                  onClick={() => handleAnswerChange(currentQuestionIndex, 'intensity', intensity as Intensity)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    answers[currentQuestionIndex]?.intensity === intensity
                      ? 'border-[#8B7355] bg-[#8B7355]/5 text-[#8B7355]'
                      : 'border-[#E5E5E5] bg-white text-[#6B6B6B] hover:border-[#8B7355]/50'
                  }`}
                >
                  {intensity === 'thought' ? 'Just a thought' : 'This is urgent'}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            {currentQuestionIndex > 0 ? (
              <button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                className="px-6 py-3 text-[#6B6B6B] hover:text-[#2D2D2D]"
              >
                ← Previous
              </button>
            ) : (
              <div />
            )}

            {currentQuestionIndex < room.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                className="bg-[#2D2D2D] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#3D3D3D] transition-colors"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-[#2D2D2D] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#3D3D3D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Share anonymously →'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
