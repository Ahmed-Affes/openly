'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Logo } from '@/components/shared'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Login failed')

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
        <p className="eyebrow accent">Welcome back</p>
        <h2>Say what you<br /><em>really</em> mean.</h2>
        <p className="auth-note">Sign in to continue to your space.</p>

        {error && <div className="form-error">{error}</div>}

        <form className="create-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          </label>
          <div className="form-foot">
            <span>✦ Anonymous by design</span>
            <Button>{loading ? 'Signing in…' : 'Sign in　→'}</Button>
          </div>
        </form>

        <p className="auth-note">
          New here? <Link href="/signup">Create an account ↗</Link>
        </p>
      </div>
    </div>
  )
}
