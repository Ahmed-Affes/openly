'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { ConfirmModal } from '@/components/shared'
import { 
  ArrowLeft, 
  Bell, 
  CaretRight, 
  LockSimple, 
  Trash, 
  User, 
  Sparkle, 
  SignOut,
  ShieldCheck,
  House,
  GridFour,
  Plus,
  GearSix
} from '@phosphor-icons/react'

export default function SettingsPage() {
  const router = useRouter()
  const { user, signOut } = useUser()
  const [nudges, setNudges] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

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

  const handleDeleteAccount = async () => {
    setActionLoading(true)
    try {
      await signOut()
      router.push('/')
    } finally {
      setActionLoading(false)
      setShowDeleteModal(false)
    }
  }

  const handleSignOutConfirm = async () => {
    setActionLoading(true)
    try {
      await signOut()
      router.push('/login')
      router.refresh()
    } finally {
      setActionLoading(false)
      setShowSignOutModal(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f0e8] px-4 py-8 pb-24 md:pb-12">
      <div className="mx-auto max-w-xl">
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-heading transition"
        >
          <ArrowLeft size={16} />
          <span>Back to dashboard</span>
        </button>

        <p className="eyebrow text-[#c2674a]">Your space</p>
        <h1 className="mt-1 font-serif text-3xl sm:text-4xl text-heading">
          {getGreeting()}, {firstName}.
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Manage your account preferences and workspace settings.
        </p>

        {/* Setting rows as proper cards with hover state */}
        <div className="mt-6 sm:mt-8 flex flex-col gap-3">
          {rows.map(({ icon: Icon, title, sub, action, toggle, value, set }) => (
            <button
              key={title}
              onClick={toggle ? () => set?.(!value) : action}
              className="flex min-h-20 items-center gap-3 sm:gap-4 rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-4 sm:p-5 text-left transition hover:-translate-y-1 hover:shadow-md cursor-pointer"
            >
              <span className="flex size-10 sm:size-11 items-center justify-center rounded-full bg-[#7c8c5e]/20 text-[#7c8c5e] shrink-0">
                <Icon size={20} />
              </span>
              <span className="flex-1 min-w-0">
                <strong className="block text-sm text-heading truncate">{title}</strong>
                <small className="block text-xs text-muted-foreground truncate">{sub}</small>
              </span>
              {toggle ? (
                <span
                  className={`h-6 w-11 rounded-full p-1 transition shrink-0 ${
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
                <CaretRight size={18} className="text-muted-foreground shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Plan Indicator */}
        <div className="mt-6 sm:mt-8 rounded-2xl border-l-4 border-l-[#c2674a] bg-[#ede8dc] border border-[#ddd5c8] p-5 sm:p-6 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg sm:text-xl text-heading">Current Plan: Free</h3>
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
        <div className="mt-4 rounded-2xl bg-[#1c1917] p-5 sm:p-6 text-[#f5f0e8] flex items-start gap-3">
          <ShieldCheck size={26} className="text-[#c2674a] shrink-0 mt-0.5" weight="fill" />
          <div className="text-xs space-y-1">
            <strong className="block text-sm font-serif text-[#f5f0e8]">Built for psychological safety.</strong>
            <p className="text-[#f5f0e8]/75 leading-relaxed text-xs">
              We never log responder IP addresses, sell data, or compromise anonymous feedback anonymity.
            </p>
          </div>
        </div>

        {/* Danger Zone at bottom */}
        <div className="mt-8 border-t border-[#ddd5c8] pt-6 space-y-4">
          <h4 className="font-serif text-lg text-heading">Account Actions</h4>

          <div className="rounded-2xl border border-[#c0392b]/30 bg-[#c0392b]/5 p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <strong className="block text-sm text-[#c0392b]">Delete workspace account</strong>
                <small className="text-xs text-muted-foreground">Permanently remove all rooms, submissions, and account data</small>
              </div>
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="self-start sm:self-auto px-4 py-2 bg-[#c0392b] text-white rounded-full text-xs font-semibold hover:bg-[#a93226] transition flex items-center gap-1.5 shrink-0"
              >
                <Trash size={14} />
                <span>Delete Account</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowSignOutModal(true)}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#1c1917] text-[#1c1917] hover:bg-[#1c1917] hover:text-[#f5f0e8] transition text-xs font-semibold"
          >
            <SignOut size={16} />
            <span>Sign out of workspace</span>
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete workspace account?"
        description="Are you sure you want to permanently delete your account? All rooms, questions, and anonymous submissions will be removed permanently."
        confirmText="Delete Account"
        cancelText="Cancel"
        variant="danger"
        loading={actionLoading}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
      />

      {/* Sign Out Modal */}
      <ConfirmModal
        isOpen={showSignOutModal}
        title="Sign out of Openly?"
        description="You will need to enter your email and password to access your creator dashboard again."
        confirmText="Sign Out"
        cancelText="Stay signed in"
        variant="primary"
        loading={actionLoading}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleSignOutConfirm}
      />

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-nav-bar" aria-label="Mobile navigation">
        <button 
          className="mobile-nav-item" 
          onClick={() => router.push('/dashboard')}
        >
          <House size={20} />
          <span>Overview</span>
        </button>
        <button 
          className="mobile-nav-item" 
          onClick={() => router.push('/dashboard#rooms')}
        >
          <GridFour size={20} />
          <span>Rooms</span>
        </button>
        <button 
          className="mobile-nav-item !text-[#c2674a]" 
          onClick={() => router.push('/room/create')}
        >
          <Plus size={22} weight="bold" />
          <span>New</span>
        </button>
        <button 
          className="mobile-nav-item active" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <GearSix size={20} weight="fill" />
          <span>Settings</span>
        </button>
      </nav>
    </main>
  )
}
