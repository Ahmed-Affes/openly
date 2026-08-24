'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Logo, Pill } from '@/components/shared'
import { ROOM_TYPES } from '@/constants'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [demoReaction, setDemoReaction] = useState(65)
  const [demoIntensity, setDemoIntensity] = useState<'thought' | 'urgent'>('thought')
  const [demoText, setDemoText] = useState('')
  const [demoSubmitted, setDemoSubmitted] = useState(false)
  const [activeFormat, setActiveFormat] = useState('pulse_check')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [supabase])

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setDemoSubmitted(true)
    setTimeout(() => {
      setDemoSubmitted(false)
      setDemoText('')
    }, 4000)
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2D2D2D] selection:bg-[#8B7355]/20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur border-b border-[#E5E5E5] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <Logo />
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#6B6B6B]">
              <a href="#formats" className="hover:text-[#2D2D2D] transition-colors">Formats</a>
              <a href="#how-it-works" className="hover:text-[#2D2D2D] transition-colors">How it works</a>
              <a href="#safety-score" className="hover:text-[#2D2D2D] transition-colors">Safety Score</a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-[#2D2D2D] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#3D3D3D] transition-all shadow-sm flex items-center gap-2"
              >
                <span>Dashboard</span>
                <span>→</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-[#6B6B6B] hover:text-[#2D2D2D] px-3 py-2 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="bg-[#2D2D2D] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#3D3D3D] transition-all shadow-sm"
                >
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 pt-16 pb-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex">
              <Pill>✦ Anonymous by design</Pill>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-serif leading-[1.1] text-[#2D2D2D] tracking-tight">
              Say what you <br />
              <em className="text-[#8B7355] italic font-serif">really</em> mean.
            </h1>

            <p className="text-lg sm:text-xl text-[#6B6B6B] max-w-xl font-normal leading-relaxed">
              A slower, kinder way to collect honest feedback and psychological safety metrics from your team without performance, peer pressure, or fear.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href={user ? "/room/create" : "/signup"}
                className="bg-[#2D2D2D] text-white px-7 py-3.5 rounded-xl font-medium hover:bg-[#3D3D3D] transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-base"
              >
                <span>Start a room free</span>
                <span>→</span>
              </Link>
              
              <a
                href="#interactive-demo"
                className="border border-[#E5E5E5] bg-white text-[#2D2D2D] px-6 py-3.5 rounded-xl font-medium hover:border-[#8B7355] transition-all text-base"
              >
                Try the live survey
              </a>
            </div>

            <div className="pt-6 flex items-center gap-6 text-xs text-[#6B6B6B]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                No respondent login required
              </span>
              <span>•</span>
              <span>Zero IP or identity tracking</span>
              <span>•</span>
              <span>Two-way anonymous threads</span>
            </div>
          </div>

          {/* Interactive Live Survey Preview */}
          <div id="interactive-demo" className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#8B7355]/10 text-[#8B7355] text-[11px] font-semibold tracking-wider uppercase px-3 py-1 rounded-bl-lg">
                Interactive Survey
              </div>

              <div className="flex items-center gap-2 text-xs text-[#8B7355] mb-2 font-medium">
                <span>✦ Sprint Retro Check-In</span>
                <span>·</span>
                <span className="text-[#9CA3AF]">Question 1 of 3</span>
              </div>

              <h2 className="text-xl font-serif text-[#2D2D2D] mb-4">
                What is something we could do <em>better?</em>
              </h2>

              <p className="text-xs text-[#6B6B6B] mb-5">
                Your answer is 100% anonymous. Take your time.
              </p>

              {demoSubmitted ? (
                <div className="py-12 text-center space-y-3 bg-[#FAF8F5] rounded-xl border border-emerald-200">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-lg font-bold">
                    ✓
                  </div>
                  <h3 className="font-serif text-lg text-[#2D2D2D]">Response submitted anonymously!</h3>
                  <p className="text-xs text-[#6B6B6B] max-w-xs mx-auto">
                    Your team lead receives this thought grouped by sentiment without any identifying details.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleDemoSubmit} className="space-y-5">
                  <textarea
                    value={demoText}
                    onChange={(e) => setDemoText(e.target.value)}
                    placeholder="Say it how you would say it to a friend..."
                    rows={3}
                    required
                    className="w-full px-4 py-3 border border-[#E5E5E5] rounded-xl text-sm placeholder-[#9CA3AF] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B7355] transition-all"
                  />

                  {/* Reaction Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-[#2D2D2D]">How does this feel?</span>
                      <span className="text-[#8B7355]">
                        {demoReaction < 40 ? 'Totally fine' : demoReaction > 70 ? 'A real problem' : 'Worth exploring'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={demoReaction}
                      onChange={(e) => setDemoReaction(Number(e.target.value))}
                      className="w-full accent-[#8B7355] cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-[#9CA3AF]">
                      <span>Totally fine</span>
                      <span>A real problem</span>
                    </div>
                  </div>

                  {/* Intensity Pills */}
                  <div className="space-y-2">
                    <span className="block text-xs font-medium text-[#2D2D2D]">Weight</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDemoIntensity('thought')}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                          demoIntensity === 'thought'
                            ? 'border-[#8B7355] bg-[#8B7355]/10 text-[#8B7355]'
                            : 'border-[#E5E5E5] bg-white text-[#6B6B6B]'
                        }`}
                      >
                        💭 Just a thought
                      </button>
                      <button
                        type="button"
                        onClick={() => setDemoIntensity('urgent')}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                          demoIntensity === 'urgent'
                            ? 'border-[#8B7355] bg-[#8B7355]/10 text-[#8B7355]'
                            : 'border-[#E5E5E5] bg-white text-[#6B6B6B]'
                        }`}
                      >
                        ⚡ This is urgent
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#2D2D2D] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#3D3D3D] transition-colors shadow-sm"
                  >
                    Share anonymously →
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Formats Bento Grid Section */}
      <section id="formats" className="px-6 py-20 bg-white border-y border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Pill>5 Room Formats</Pill>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#2D2D2D] mt-4 mb-3">
              Spaces designed for every kind of truth.
            </h2>
            <p className="text-[#6B6B6B] text-base">
              Different questions require different structures. Pick a format that sets the right tone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ROOM_TYPES.map((type) => (
              <div
                key={type.value}
                className="p-8 rounded-2xl border border-[#E5E5E5] bg-[#FAF8F5] hover:border-[#8B7355] hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="text-3xl mb-4">{type.icon}</div>
                  <h3 className="text-xl font-serif text-[#2D2D2D] mb-2">{type.label}</h3>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed mb-6">
                    {type.description}
                  </p>
                </div>
                <Link
                  href={user ? "/room/create" : "/signup"}
                  className="text-xs font-semibold text-[#8B7355] hover:underline flex items-center gap-1"
                >
                  <span>Create {type.label}</span>
                  <span>→</span>
                </Link>
              </div>
            ))}

            <div className="p-8 rounded-2xl border border-[#8B7355]/30 bg-[#8B7355]/5 flex flex-col justify-between">
              <div>
                <div className="text-3xl mb-4">✦</div>
                <h3 className="text-xl font-serif text-[#2D2D2D] mb-2">Two-Way Anonymous Threads</h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">
                  Creators can ask clarifying questions directly on a submission without ever exposing the responder's identity.
                </p>
              </div>
              <span className="text-xs font-semibold text-[#8B7355]">
                Built into every room
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="px-6 py-20 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Pill>Simple & Safe</Pill>
          <h2 className="text-3xl sm:text-4xl font-serif text-[#2D2D2D] mt-4 mb-3">
            Honest feedback in 3 quiet steps.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-[#E5E5E5] space-y-4">
            <span className="w-10 h-10 rounded-full bg-[#8B7355]/10 text-[#8B7355] flex items-center justify-center font-serif font-bold">
              01
            </span>
            <h3 className="text-xl font-serif text-[#2D2D2D]">Create your room</h3>
            <p className="text-sm text-[#6B6B6B] leading-relaxed">
              Choose your format, add custom prompts or pick from curated templates in under 30 seconds.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-[#E5E5E5] space-y-4">
            <span className="w-10 h-10 rounded-full bg-[#8B7355]/10 text-[#8B7355] flex items-center justify-center font-serif font-bold">
              02
            </span>
            <h3 className="text-xl font-serif text-[#2D2D2D]">Share the link</h3>
            <p className="text-sm text-[#6B6B6B] leading-relaxed">
              Send your room link to Slack, Teams, or email. Responders don't need accounts, ensuring zero friction.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-[#E5E5E5] space-y-4">
            <span className="w-10 h-10 rounded-full bg-[#8B7355]/10 text-[#8B7355] flex items-center justify-center font-serif font-bold">
              03
            </span>
            <h3 className="text-xl font-serif text-[#2D2D2D]">Act on insights</h3>
            <p className="text-sm text-[#6B6B6B] leading-relaxed">
              Explore sentiment distributions, follow up anonymously via threads, and track psychological safety over time.
            </p>
          </div>
        </div>
      </section>

      {/* Safety Score Banner */}
      <section id="safety-score" className="px-6 py-16 bg-[#2D2D2D] text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-block bg-white/10 text-white/90 text-xs font-semibold px-3 py-1 rounded-full">
              ✦ Proprietary Trust Metrics
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif text-white leading-tight">
              Measuring psychological safety without compromising individuals.
            </h2>
            <p className="text-white/70 max-w-2xl text-sm sm:text-base leading-relaxed">
              Openly combines response depth, participation rates, and thread engagement into a single 0-100 safety score so leaders understand how open their team truly feels.
            </p>
          </div>

          <div className="lg:col-span-4 flex justify-start lg:justify-end">
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur text-center w-full max-w-xs">
              <span className="text-xs text-white/60 uppercase tracking-wider block mb-1">Safety Index</span>
              <span className="text-5xl font-serif font-bold text-white block mb-1">84</span>
              <span className="text-xs text-emerald-400 font-medium block">↑ 8 points this cycle</span>
              <p className="text-xs text-white/50 mt-3 pt-3 border-t border-white/10">
                “Team is engaging with high candor and thoughtful reflections.”
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 py-24 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-3xl sm:text-5xl font-serif text-[#2D2D2D]">
          Ready to hear what your team really thinks?
        </h2>
        <p className="text-[#6B6B6B] text-lg max-w-xl mx-auto">
          Create your first room today. Free forever for teams of any size.
        </p>
        <div className="pt-4">
          <Link
            href={user ? "/room/create" : "/signup"}
            className="inline-flex items-center gap-2 bg-[#2D2D2D] text-white px-8 py-4 rounded-xl text-base font-medium hover:bg-[#3D3D3D] transition-all shadow-md"
          >
            <span>Start your first room</span>
            <span>→</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E5E5] bg-white px-6 py-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <Logo />
          <div className="flex items-center gap-6 text-sm text-[#6B6B6B]">
            <Link href="/login" className="hover:text-[#2D2D2D]">Sign in</Link>
            <Link href="/signup" className="hover:text-[#2D2D2D]">Sign up</Link>
            <Link href="/dashboard" className="hover:text-[#2D2D2D]">Dashboard</Link>
          </div>
          <p className="text-xs text-[#9CA3AF]">
            © {new Date().getFullYear()} Openly · Say what you really mean.
          </p>
        </div>
      </footer>
    </div>
  )
}
