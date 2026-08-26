'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RoomWithQuestions } from '@/types'
import { RoomTypeBadge, DatePicker, Button } from '@/components/shared'
import { 
  ArrowLeft, 
  Check, 
  Trash, 
  Plus, 
  ShieldCheck, 
  XCircle,
  WarningCircle
} from '@phosphor-icons/react'

export default function RoomDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const [room, setRoom] = useState<RoomWithQuestions | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'open' | 'closed' | 'scheduled'>('open')
  const [closesAt, setClosesAt] = useState('')
  const [questions, setQuestions] = useState<{ id?: string; text: string }[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
        setName(data.name)
        setDescription(data.description || '')
        setStatus(data.status)
        if (data.closes_at) {
          try {
            setClosesAt(new Date(data.closes_at).toISOString())
          } catch {}
        }
        if (data.questions) {
          const sorted = [...data.questions].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
          setQuestions(sorted.map(q => ({ id: q.id, text: q.text })))
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load room')
      } finally {
        setLoading(false)
      }
    }

    loadRoom()
  }, [params.id, supabase])

  const handleAddQuestion = () => {
    if (questions.length < 5) {
      setQuestions([...questions, { text: '' }])
    }
  }

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== idx))
    }
  }

  const handleQuestionTextChange = (idx: number, text: string) => {
    const updated = [...questions]
    updated[idx].text = text
    setQuestions(updated)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const validQuestions = questions.filter(q => q.text.trim())
    if (validQuestions.length === 0) {
      setError('Please provide at least one question for your room.')
      setSaving(false)
      return
    }

    try {
      const response = await fetch(`/api/rooms/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          status,
          closes_at: closesAt ? new Date(closesAt).toISOString() : null,
          questions: validQuestions,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update room')
      }

      setSuccess('Room and questions updated successfully!')
      setTimeout(() => {
        router.push(`/room/${params.id}/results`)
      }, 1000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRoom = async () => {
    if (!room) return
    if (confirm(`Are you sure you want to permanently delete "${room.name}"? All responses and questions will be erased.`)) {
      setDeleting(true)
      try {
        const response = await fetch(`/api/rooms/${params.id}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          router.push('/dashboard')
        } else {
          const data = await response.json()
          throw new Error(data.error || 'Failed to delete room')
        }
      } catch (err: any) {
        setError(err.message)
        setDeleting(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8] text-muted-foreground">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#c2674a] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-medium text-sm">Loading room settings…</p>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8] text-center px-6">
        <div>
          <h1 className="font-serif text-3xl text-heading">Room not found</h1>
          <button onClick={() => router.push('/dashboard')} className="primary-button mt-6 text-xs">
            ← Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8] px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push(`/room/${params.id}/results`)}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-heading transition"
          >
            <ArrowLeft size={16} />
            <span>Back to results</span>
          </button>
          <RoomTypeBadge type={room.type} />
        </div>

        {/* Edit Card */}
        <div className="rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-7 shadow-sm">
          <h1 className="text-3xl font-serif text-heading mb-2">Edit Room & Questions</h1>
          <p className="text-xs text-muted-foreground mb-6">Manage room name, description, prompts, and access status.</p>

          {error && (
            <div className="mb-5 bg-[#c0392b]/10 border border-[#c0392b]/30 text-[#c0392b] px-4 py-3 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 bg-[#7c8c5e]/20 border border-[#7c8c5e]/40 text-[#7c8c5e] px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
              <Check size={16} weight="bold" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-heading mb-1.5">
                Room title
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full text-base"
                placeholder="Room title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-heading mb-1.5">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full text-sm"
                placeholder="Give context to your team on what this feedback will be used for…"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-heading mb-1.5">
                  Room Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-sm"
                >
                  <option value="open">Open (Accepting submissions)</option>
                  <option value="closed">Closed (Locked)</option>
                </select>
              </div>

              <div>
                <DatePicker
                  value={closesAt}
                  onChange={setClosesAt}
                  label="Automatic Close Date"
                  placeholder="Choose close date"
                />
              </div>
            </div>

            {/* Questions list editing */}
            <div className="pt-4 border-t border-[#ddd5c8]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-serif font-semibold text-heading">Questions ({questions.length}/5)</h3>
                {questions.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#c2674a] hover:underline"
                  >
                    <Plus size={14} weight="bold" />
                    <span>Add Question</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-[#faf7f2] p-3 rounded-xl border border-[#ddd5c8]">
                    <span className="text-xs font-bold text-[#c2674a] pt-2">Q{idx + 1}</span>
                    <input
                      type="text"
                      value={q.text}
                      onChange={(e) => handleQuestionTextChange(idx, e.target.value)}
                      placeholder="Enter question prompt…"
                      className="flex-1 text-sm bg-transparent border-0 p-1 focus:ring-0"
                      required
                    />
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="text-muted-foreground hover:text-[#c0392b] p-1.5"
                        title="Remove question"
                      >
                        <Trash size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-[#ddd5c8]">
              <button
                type="button"
                onClick={() => router.push(`/room/${params.id}/results`)}
                className="secondary-button text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="primary-button text-xs"
              >
                {saving ? 'Saving changes…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="rounded-2xl border border-[#c0392b]/30 bg-[#c0392b]/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg text-[#c0392b]">Danger Zone</h3>
              <p className="text-xs text-muted-foreground">Permanently delete this room and all submitted feedback.</p>
            </div>
            <button
              type="button"
              onClick={handleDeleteRoom}
              disabled={deleting}
              className="px-4 py-2 bg-[#c0392b] text-white rounded-full text-xs font-semibold hover:bg-[#a93226] transition flex items-center gap-1.5"
            >
              <Trash size={14} />
              <span>{deleting ? 'Deleting…' : 'Delete Room'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
