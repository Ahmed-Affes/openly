'use client'

import Link from 'next/link'
import { Logo } from '@/components/shared'
import { 
  ArrowLeft, 
  ShieldCheck, 
  LockSimple, 
  EyeSlash, 
  FingerprintSimple, 
  Database,
  ArrowRight
} from '@phosphor-icons/react'

export default function PrivacyPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ede8dc] border border-[#ddd5c8] text-xs font-semibold text-[#7c8c5e]">
            <ShieldCheck size={16} weight="fill" />
            <span>Zero Identification Architecture</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl text-heading leading-[1.05]">
            Anonymity is a <em>guarantee</em>, not a promise.
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Openly is engineered to mathematically protect the identity of every respondent. Here is exactly how we ensure you can speak freely without fear.
          </p>
        </div>

        {/* Technical Privacy Pillars */}
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-8 shadow-sm space-y-3">
            <div className="size-10 rounded-xl bg-[#faf7f2] border border-[#ddd5c8] grid place-items-center text-[#7c8c5e]">
              <EyeSlash size={22} weight="duotone" />
            </div>
            <h2 className="font-serif text-2xl text-heading">No Respondent Accounts</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When responding to a room, you never log in, enter an email address, or provide personal details. You simply open the link and share your perspective.
            </p>
          </article>

          <article className="rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-8 shadow-sm space-y-3">
            <div className="size-10 rounded-xl bg-[#faf7f2] border border-[#ddd5c8] grid place-items-center text-[#c2674a]">
              <FingerprintSimple size={22} weight="duotone" />
            </div>
            <h2 className="font-serif text-2xl text-heading">No IP Address Logging</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We do not store IP addresses or tracking cookies with your feedback submissions. Anti-spam checks use one-way non-reversible device hashes stored locally.
            </p>
          </article>

          <article className="rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-8 shadow-sm space-y-3">
            <div className="size-10 rounded-xl bg-[#faf7f2] border border-[#ddd5c8] grid place-items-center text-[#4a6580]">
              <Database size={22} weight="duotone" />
            </div>
            <h2 className="font-serif text-2xl text-heading">Submissions Shuffled</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              To prevent time-based correlation (e.g. guessing who submitted right after a meeting), all responses are presented with randomized ordering and timing buffers.
            </p>
          </article>

          <article className="rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-8 shadow-sm space-y-3">
            <div className="size-10 rounded-xl bg-[#faf7f2] border border-[#ddd5c8] grid place-items-center text-[#8c6c2c]">
              <LockSimple size={22} weight="duotone" />
            </div>
            <h2 className="font-serif text-2xl text-heading">Encrypted Two-Way Threads</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Follow-up discussions between creators and responders remain fully blinded. Creators can ask questions and responders can answer without unmasking either identity.
            </p>
          </article>
        </div>

        {/* Reassurance Banner */}
        <div className="mt-16 rounded-2xl bg-[#ede8dc] border border-[#ddd5c8] p-8 flex items-start gap-4">
          <ShieldCheck size={32} className="text-[#7c8c5e] shrink-0 mt-1" weight="fill" />
          <div className="space-y-1">
            <h3 className="font-serif text-xl text-heading">We never monetize respondent data</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Openly generates revenue exclusively through creator and team subscriptions. We will never sell, analyze, or advertise against participant feedback.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#ddd5c8] bg-[#ede8dc] px-6 py-8 text-center text-xs text-muted-foreground">
        <p>© Openly · Say what you really mean.</p>
      </footer>
    </div>
  )
}
