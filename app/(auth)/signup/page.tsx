'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Logo } from '@/components/shared'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Signup failed')

      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Logo />
        <p className="eyebrow accent">Create something honest</p>
        <h2>Make room<br /><em>for the real stuff.</em></h2>
        <p className="auth-note">Create your account to open your first room.</p>

        {error && <div className="form-error">{error}</div>}

        <form className="create-form" onSubmit={handleSubmit}>
          <label>
            Your name
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="Maya Chen" />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="At least 6 characters" />
          </label>
          <div className="form-foot">
            <span>✦ Anonymous by design</span>
            <Button>{loading ? 'Creating…' : 'Create account　→'}</Button>
          </div>
        </form>

        <p className="auth-note">
          Already have a space? <Link href="/login">Sign in ↗</Link>
        </p>
      </div>
    </div>
  )
}
