'use client'

import Link from 'next/link'
import { Logo, Button } from '@/components/shared'
import { 
  ArrowLeft, 
  Sparkle, 
  ShieldCheck, 
  Heart, 
  ChatCircleDots, 
  EyeSlash, 
  UsersThree,
  ArrowRight
} from '@phosphor-icons/react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f5f0e8] text-[#1c1917]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#ddd5c8] bg-[#f5f0e8]/90 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" aria-label="Openly Home">
            <Logo />
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-heading transition">
            <ArrowLeft size={14} />
            <span>Back to home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ede8dc] border border-[#ddd5c8] text-xs font-semibold text-[#c2674a]">
            <Sparkle size={14} weight="fill" />
            <span>The Openly Manifesto</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl text-heading leading-[1.05]">
            Make room for the <em>thoughts that matter.</em>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Openly was built to solve a quiet crisis in modern work: most valuable feedback is never spoken aloud due to fear, performance pressure, or rigid corporate surveys.
          </p>
        </div>

        {/* Philosophy Principles */}
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-8 shadow-sm space-y-3">
            <div className="size-10 rounded-xl bg-[#faf7f2] border border-[#ddd5c8] grid place-items-center text-[#7c8c5e]">
              <Heart size={22} weight="duotone" />
            </div>
            <h2 className="font-serif text-2xl text-heading">Candor with Care</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Honesty should never feel like an interrogation or a stage performance. We design calm, slower digital spaces where teams can speak authentically and constructively.
            </p>
          </article>

          <article className="rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-8 shadow-sm space-y-3">
            <div className="size-10 rounded-xl bg-[#faf7f2] border border-[#ddd5c8] grid place-items-center text-[#c2674a]">
              <EyeSlash size={22} weight="duotone" />
            </div>
            <h2 className="font-serif text-2xl text-heading">Anonymity by Default</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Privacy is not a feature toggled in settings. It is the architectural foundation of every room. Responders never create accounts, and creators see perspectives—never personal IDs.
            </p>
          </article>

          <article className="rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-8 shadow-sm space-y-3">
            <div className="size-10 rounded-xl bg-[#faf7f2] border border-[#ddd5c8] grid place-items-center text-[#4a6580]">
              <ChatCircleDots size={22} weight="duotone" />
            </div>
            <h2 className="font-serif text-2xl text-heading">Two-Way Conversations</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Traditional surveys are one-way dead ends. Openly introduces closed-loop anonymous threads where leaders can ask clarifying follow-ups without piercing the veil of safety.
            </p>
          </article>

          <article className="rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-8 shadow-sm space-y-3">
            <div className="size-10 rounded-xl bg-[#faf7f2] border border-[#ddd5c8] grid place-items-center text-[#8c6c2c]">
              <UsersThree size={22} weight="duotone" />
            </div>
            <h2 className="font-serif text-2xl text-heading">Collective Safety Score</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We measure the room as an ecosystem of trust. Our psychological safety index helps organizations track openness trends over time without ever ranking individuals.
            </p>
          </article>
        </div>

        {/* CTA Card */}
        <div className="mt-16 rounded-2xl bg-[#1c1917] p-10 text-[#f5f0e8] text-center space-y-4">
          <h2 className="font-serif text-3xl sm:text-4xl text-[#f5f0e8]">
            Ready to hear what your team really thinks?
          </h2>
          <p className="text-sm text-[#f5f0e8]/80 max-w-lg mx-auto">
            Open a quiet room in seconds. No credit card required.
          </p>
          <div className="pt-2">
            <Link href="/signup" className="primary-button !bg-[#c2674a] hover:!bg-[#ab563b] text-xs">
              <span>Start your first room free</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#ddd5c8] bg-[#ede8dc] px-6 py-8 text-center text-xs text-muted-foreground">
        <p>© Openly · A slower, kinder room for honest thoughts.</p>
      </footer>
    </div>
  )
}
