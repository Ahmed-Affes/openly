'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RoomWithQuestions } from '@/types'
import { RoomTypeBadge, DatePicker, Button } from '@/components/shared'
import { ArrowLeft, Check, GearSix, ShieldCheck, XCircle } from '@phosphor-icons/react'

export default function RoomDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const [room, setRoom] = useState<RoomWithQuestions | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'open' | 'closed' | 'scheduled'>('open')
  const [closesAt, setClosesAt] = useState('')
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
      } catch (err: any) {
        setError(err.message || 'Failed to load room')
      } finally {
        setLoading(false)
      }
    }

    loadRoom()
  }, [params.id, supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/rooms/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          status,
          closes_at: closesAt ? new Date(closesAt).toISOString() : null,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update room')
      }

      setSuccess('Room settings saved successfully!')
      setTimeout(() => {
        router.push(`/room/${params.id}/results`)
      }, 1000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
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
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push(`/room/${params.id}/results`)}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-heading transition"
          >
            <ArrowLeft size={16} />
            <span>Back to insights</span>
          </button>
          <RoomTypeBadge type={room.type} />
        </div>

        <div className="rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-7 shadow-sm">
          <h1 className="text-3xl font-serif text-heading mb-2">Edit Room</h1>
          <p className="text-xs text-muted-foreground mb-6">Manage room name, description, and status.</p>

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

          <form onSubmit={handleSave} className="space-y-5">
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
              />
            </div>

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

            <div className="pt-4 border-t border-[#ddd5c8]">
              <h3 className="text-sm font-serif font-semibold text-heading mb-3">Questions in this room</h3>
              <div className="space-y-2">
                {room.questions.map((q, i) => (
                  <div key={q.id || i} className="p-3.5 bg-[#faf7f2] rounded-xl border border-[#ddd5c8] text-xs text-heading flex items-start gap-2">
                    <span className="font-bold text-[#c2674a]">Q{i + 1}:</span>
                    <span>{q.text}</span>
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
      </div>
    </div>
  )
}
