'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/shared'
import { ArrowRight, ShieldCheck } from '@phosphor-icons/react'

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

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex justify-center mb-6">
            <Link href="/">
              <Logo />
            </Link>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif text-heading mb-2">Welcome back.</h1>
          <p className="text-sm text-muted-foreground">Sign in to your quiet workspace</p>
        </div>

        <div className="rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-[#c0392b]/10 border border-[#c0392b]/30 text-[#c0392b] px-4 py-3 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="primary-button w-full mt-4 text-xs"
            >
              {loading ? 'Signing in…' : 'Sign in to workspace →'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[#c2674a] font-semibold hover:underline">
            Create an account free
          </Link>
        </p>
      </div>
    </div>
  )
}
