'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="logo inline-flex items-center mb-6">
            <span className="logo-mark">o</span>
            <span>openly</span>
          </div>
          <h1 className="text-3xl font-serif text-[#2D2D2D] mb-2">Welcome back.</h1>
          <p className="text-[#6B6B6B]">Sign in to continue to your space</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#2D2D2D] mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg bg-white text-[#2D2D2D] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#8B7355] focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#2D2D2D] mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg bg-white text-[#2D2D2D] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#8B7355] focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2D2D2D] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#3D3D3D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center mt-6 text-[#6B6B6B]">
          Don't have an account?{' '}
          <Link href="/signup" className="text-[#8B7355] hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
