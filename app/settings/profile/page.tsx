'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { ArrowLeft, Camera, Check, ShieldCheck } from '@phosphor-icons/react'

export default function ProfilePage() {
  const router = useRouter()
  const { user, updateProfile } = useUser()
  const [name, setName] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) setName(user.user_metadata?.name || '')
  }, [user])

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f0e8] text-muted-foreground">
        Loading profile…
      </main>
    )
  }

  const initials = (name || user.email || 'U').slice(0, 2).toUpperCase()

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile({ name })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f0e8] px-4 py-10">
      <div className="mx-auto max-w-xl">
        <button
          onClick={() => router.push('/settings')}
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-heading transition"
        >
          <ArrowLeft size={16} />
          <span>Back to settings</span>
        </button>

        <p className="eyebrow text-[#c2674a]">Your space</p>
        <h1 className="mt-2 font-serif text-4xl text-heading">Your profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Personalize your creator workspace.
        </p>

        {/* Avatar */}
        <div className="mt-8 text-center">
          <div className="group relative mx-auto flex size-24 items-center justify-center rounded-full bg-[#1c1917] font-serif text-2xl text-[#f5f0e8] shadow-md">
            <span>{initials}</span>
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-[#c2674a] text-[#f5f0e8] opacity-0 transition group-hover:opacity-100 cursor-pointer">
              <Camera size={24} />
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Creator Avatar</p>
        </div>

        {/* Form fields */}
        <div className="mt-8 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-heading mb-1.5">Display name</label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setSaved(false)
              }}
              className="w-full text-base"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-heading mb-1.5">Email address</label>
            <div className="relative">
              <input
                value={user.email || ''}
                readOnly
                className="w-full text-base pr-24 opacity-80 cursor-not-allowed"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-[#7c8c5e]/20 px-2.5 py-0.5 text-xs font-semibold text-[#7c8c5e]">
                Verified
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="primary-button mt-8 inline-flex items-center gap-2 text-xs"
        >
          {saved && <Check size={16} weight="bold" className="text-[#7c8c5e]" />}
          <span>{saved ? 'Changes saved' : saving ? 'Saving…' : 'Save changes'}</span>
        </button>

        <div className="mt-10 flex items-start gap-3 rounded-2xl bg-[#ede8dc] border border-[#ddd5c8] p-4 text-xs text-muted-foreground">
          <ShieldCheck size={24} className="shrink-0 text-[#c2674a]" weight="fill" />
          <span>Your creator profile is never shown to anonymous respondents. Your feedback rooms remain safe and private.</span>
        </div>
      </div>
    </main>
  )
}
