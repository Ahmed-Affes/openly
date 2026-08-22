'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { useUser } from '@/hooks/useUser'

export default function SettingsPage() {
  const router = useRouter()
  const { user, signOut } = useUser()
  const [emailNudges, setEmailNudges] = useState(true)

  const name = (user?.user_metadata?.name as string | undefined) || user?.email?.split('@')[0] || 'You'

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <AppShell title="Settings">
      <div className="page-content narrow settings-page">
        <section className="intro">
          <p className="eyebrow accent">Your space</p>
          <h2>Keep it<br /><em>comfortable.</em></h2>
          <p>Small choices that keep Openly feeling like Openly.</p>
        </section>

        <div className="settings-list">
          <button>
            <span className="setting-icon">○</span>
            <span><strong>Your profile</strong><small>{name} · {user?.email || 'Not signed in'}</small></span>
            <b>→</b>
          </button>
          <button onClick={() => setEmailNudges(!emailNudges)}>
            <span className="setting-icon">♧</span>
            <span><strong>Email nudges</strong><small>{emailNudges ? 'A gentle nudge, never a buzz' : 'Notifications are paused'}</small></span>
            <span className={`toggle ${emailNudges ? 'on' : ''}`}><i></i></span>
          </button>
          <button>
            <span className="setting-icon">✦</span>
            <span><strong>Privacy & anonymity</strong><small>Your answers are always anonymous</small></span>
            <b>→</b>
          </button>
          <button>
            <span className="setting-icon">?</span>
            <span><strong>About Openly</strong><small>Our values and house rules</small></span>
            <b>→</b>
          </button>
          <button onClick={handleSignOut}>
            <span className="setting-icon">↩</span>
            <span><strong>Sign out</strong><small>Close your space for now</small></span>
            <b>→</b>
          </button>
        </div>

        <div className="privacy-card">
          <span>✦</span>
          <div>
            <strong>Built for honest rooms.</strong>
            <p>We never show names, store IP addresses, or sell your thoughts. Rooms quietly disappear after 90 days of inactivity.</p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
