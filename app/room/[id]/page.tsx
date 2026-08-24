'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RoomWithQuestions } from '@/types'
import { Pill } from '@/components/shared'

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
            setClosesAt(new Date(data.closes_at).toISOString().slice(0, 16))
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

      setSuccess('Room updated successfully!')
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
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <div className="text-[#6B6B6B]">Loading room...</div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <div className="text-[#6B6B6B]">Room not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push(`/room/${params.id}/results`)}
            className="text-sm text-[#6B6B6B] hover:text-[#2D2D2D]"
          >
            ← Back to insights
          </button>
          <Pill>{room.type}</Pill>
        </div>

        <div className="bg-white rounded-lg border border-[#E5E5E5] p-6 shadow-sm">
          <h1 className="text-2xl font-serif text-[#2D2D2D] mb-4">Edit Room</h1>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-1">
                Room name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
              >
                <option value="open">Open (Accepting submissions)</option>
                <option value="closed">Closed</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-1">
                Automatic Close Date <span className="text-[#6B6B6B] font-normal">(Optional)</span>
              </label>
              <input
                type="datetime-local"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
              />
              <p className="text-xs text-[#6B6B6B] mt-1">
                Leave empty or clear this field so the room never expires automatically.
              </p>
            </div>

            <div className="pt-4 border-t border-[#E5E5E5]">
              <h3 className="text-sm font-medium text-[#2D2D2D] mb-2">Questions in this room</h3>
              <div className="space-y-2">
                {room.questions.map((q, i) => (
                  <div key={q.id || i} className="p-3 bg-[#FAF8F5] rounded text-sm text-[#2D2D2D]">
                    <span className="font-semibold text-[#8B7355] mr-2">Q{i + 1}:</span>
                    {q.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push(`/room/${params.id}/results`)}
                className="px-4 py-2 border border-[#E5E5E5] rounded-lg text-sm text-[#6B6B6B] hover:text-[#2D2D2D]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-[#2D2D2D] text-white rounded-lg text-sm hover:bg-[#3D3D3D] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
