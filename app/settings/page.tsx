'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { 
  ArrowLeft, 
  Bell, 
  CaretRight, 
  LockSimple, 
  Trash, 
  User, 
  Sparkle, 
  SignOut,
  ShieldCheck
} from '@phosphor-icons/react'

export default function SettingsPage() {
  const router = useRouter()
  const { user, signOut } = useUser()
  const [nudges, setNudges] = useState(true)
  const [autoDelete, setAutoDelete] = useState(false)

  const firstName = user?.user_metadata?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f0e8] text-muted-foreground">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#c2674a] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-medium text-sm">Opening your workspace settings…</p>
        </div>
      </main>
    )
  }

  const rows = [
    {
      icon: User,
      title: 'Your profile',
      sub: `${user.user_metadata?.name || 'Add your name'} · ${user.email}`,
      action: () => router.push('/settings/profile'),
    },
    {
      icon: Bell,
      title: 'Email nudges',
      sub: nudges ? 'Gentle summary when new responses arrive' : 'Notifications paused',
      toggle: true,
      value: nudges,
      set: setNudges,
    },
    {
      icon: LockSimple,
      title: 'Privacy & anonymity',
      sub: 'Learn how Openly protects anonymous responses',
      action: () => router.push('/privacy'),
    },
    {
      icon: Sparkle,
      title: 'About Openly',
      sub: 'Our philosophy and intentional design values',
      action: () => router.push('/about'),
    },
  ]

  return (
    <main className="min-h-screen bg-[#f5f0e8] px-4 py-10">
      <div className="mx-auto max-w-xl">
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-heading transition"
        >
          <ArrowLeft size={16} />
          <span>Back to dashboard</span>
        </button>

        <p className="eyebrow text-[#c2674a]">Your space</p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-heading">
          {getGreeting()}, {firstName}.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account preferences and workspace settings.
        </p>

        {/* Setting rows as proper cards with hover state */}
        <div className="mt-8 flex flex-col gap-3">
          {rows.map(({ icon: Icon, title, sub, action, toggle, value, set }) => (
            <button
              key={title}
              onClick={toggle ? () => set?.(!value) : action}
              className="flex min-h-20 items-center gap-4 rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-5 text-left transition hover:-translate-y-1 hover:shadow-md cursor-pointer"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-[#7c8c5e]/20 text-[#7c8c5e] shrink-0">
                <Icon size={22} />
              </span>
              <span className="flex-1">
                <strong className="block text-sm text-heading">{title}</strong>
                <small className="text-xs text-muted-foreground">{sub}</small>
              </span>
              {toggle ? (
                <span
                  className={`h-6 w-11 rounded-full p-1 transition ${
                    value ? 'bg-[#c2674a]' : 'bg-[#ddd5c8]'
                  }`}
                >
                  <i
                    className={`block size-4 rounded-full bg-[#f5f0e8] transition ${
                      value ? 'translate-x-5' : ''
                    }`}
                  />
                </span>
              ) : (
                <CaretRight size={18} className="text-muted-foreground" />
              )}
            </button>
          ))}
        </div>

        {/* Plan Indicator */}
        <div className="mt-8 rounded-2xl border-l-4 border-l-[#c2674a] bg-[#ede8dc] border border-[#ddd5c8] p-6 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl text-heading">Current Plan: Free</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-[#7c8c5e]/20 text-[#7c8c5e] text-xs font-semibold">Active</span>
          </div>
          <p className="text-xs text-muted-foreground">
            3 rooms · 15 responses per room · Anonymous threads enabled
          </p>
          <div className="pt-2">
            <button onClick={() => router.push('/#pricing')} className="text-xs font-semibold text-[#c2674a] hover:underline">
              Upgrade to Pro for unlimited rooms →
            </button>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="mt-4 rounded-2xl bg-[#1c1917] p-6 text-[#f5f0e8] flex items-start gap-3">
          <ShieldCheck size={26} className="text-[#c2674a] shrink-0 mt-0.5" weight="fill" />
          <div className="text-xs space-y-1">
            <strong className="block text-sm font-serif">Built for psychological safety.</strong>
            <p className="text-[#f5f0e8]/75 leading-relaxed">
              We never log responder IP addresses, sell data, or compromise anonymous submission anonymity.
            </p>
          </div>
        </div>

        {/* Danger Zone at bottom */}
        <div className="mt-10 border-t border-[#ddd5c8] pt-8 space-y-6">
          <h4 className="font-serif text-lg text-heading">Danger Zone</h4>

          <div className="rounded-2xl border border-[#c0392b]/30 bg-[#c0392b]/5 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <strong className="block text-sm text-[#c0392b]">Delete workspace account</strong>
                <small className="text-xs text-muted-foreground">Permanently remove all rooms, submissions, and account data</small>
              </div>
              <button 
                onClick={() => {
                  if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                    signOut()
                    router.push('/')
                  }
                }}
                className="px-4 py-2 bg-[#c0392b] text-white rounded-full text-xs font-semibold hover:bg-[#a93226] transition flex items-center gap-1.5"
              >
                <Trash size={14} />
                <span>Delete Account</span>
              </button>
            </div>
          </div>

          <button
            onClick={async () => {
              await signOut()
              router.push('/login')
            }}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[#1c1917] text-[#1c1917] hover:bg-[#1c1917] hover:text-[#f5f0e8] transition text-sm font-semibold"
          >
            <SignOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </main>
  )
}
