'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Logo, RoomTypeBadge } from '@/components/shared'
import { 
  ChatCircleDots, 
  ShieldCheck, 
  Sparkle, 
  ArrowRight, 
  LockSimple, 
  ArrowsClockwise,
  Users,
  Check,
  CheckCircle
} from '@phosphor-icons/react'

const formats = [
  { type: 'pulse_check', title: 'Pulse Check', desc: 'A quick temperature check for the room to see how people feel.' },
  { type: 'open_feedback', title: 'Open Feedback', desc: 'Let people say what does not fit into rigid corporate forms.' },
  { type: 'qa', title: 'Q&A', desc: 'Ask challenging questions safely and get honest, authentic answers.' },
  { type: 'decision_vote', title: 'Decision Vote', desc: 'See where the real consensus lives without loud voices dominating.' },
  { type: 'hot_take', title: 'Hot Take', desc: 'Make space for the bold opinion behind the polite conversation.' },
]

export default function HomePage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [annual, setAnnual] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [supabase])

  const [demoReaction, setDemoReaction] = useState(72)

  const getDemoLabel = (n: number) => {
    if (n < 25) return { text: 'Calm / Great', color: '#7c8c5e' }
    if (n < 50) return { text: 'Manageable', color: '#7c8c5e' }
    if (n < 75) return { text: 'Concerning', color: '#e2c054' }
    return { text: 'Critical Issue', color: '#c2674a' }
  }

  const demoStatus = getDemoLabel(demoReaction)

  const startHref = user ? '/room/create' : '/signup'

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-[#1c1917]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#ddd5c8] bg-[#f5f0e8]/90 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" aria-label="Openly Home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#formats" className="hover:text-heading transition">Formats</a>
            <a href="#how-it-works" className="hover:text-heading transition">How it works</a>
            <a href="#safety-score" className="hover:text-heading transition">Safety Score</a>
            <a href="#pricing" className="hover:text-heading transition">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Link className="primary-button text-xs" href="/dashboard">
                <span>Dashboard</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link className="text-xs font-semibold text-muted-foreground hover:text-heading px-3 py-2" href="/login">
                  Sign in
                </Link>
                <Link className="primary-button text-xs" href="/signup">
                  <span>Get started free</span>
                  <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.1fr_.9fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ede8dc] border border-[#ddd5c8] text-xs font-semibold text-[#c2674a]">
              <ShieldCheck size={16} weight="fill" />
              <span>Anonymous by design</span>
            </div>

            <h1 className="font-serif text-5xl leading-[1.02] sm:text-7xl text-heading">
              Say what you <em className="text-[#c2674a] italic">really</em> mean.
            </h1>

            <p className="max-w-xl text-base sm:text-lg leading-relaxed text-muted-foreground">
              A slower, kinder way to collect honest feedback and psychological safety metrics from your team without performance, peer pressure, or fear.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href={startHref} className="primary-button text-sm">
                <span>Start a room free</span>
                <ArrowRight size={16} />
              </Link>
              <a href="#demo" className="secondary-button text-sm">
                <span>Try the live preview</span>
              </a>
            </div>

            <p className="text-xs text-muted-foreground pt-2">
              1,200+ teams already speaking freely · No respondent sign-up required
            </p>
          </div>

          {/* Interactive Demo Preview Card */}
          <div id="demo" className="rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-7 shadow-lg relative">
            <p className="eyebrow text-[#c2674a]">Interactive preview · Question 1 of 3</p>
            <h2 className="mt-3 font-serif text-2xl sm:text-3xl text-heading">
              What could we do <em>better?</em>
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Your answer is 100% anonymous. Take your time.
            </p>

            <div className="mt-5 p-4 rounded-xl bg-[#faf7f2] border border-[#ddd5c8] text-xs text-heading leading-relaxed italic">
              “I feel our handoff process feels rushed right before client reviews…”
            </div>

            <div className="mt-4 flex items-center justify-between text-xs font-semibold">
              <span className="text-heading">How does this feel?</span>
              <span style={{ color: demoStatus.color }}>{demoStatus.text} ({demoReaction}/100)</span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={demoReaction}
              onChange={(e) => setDemoReaction(Number(e.target.value))}
              className="reaction-range"
              aria-label="Reaction feeling slider demo"
            />

            <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
              <span className="text-[#7c8c5e]">Calm / Great</span>
              <span className="text-[#c2674a]">Critical issue</span>
            </div>
          </div>
        </section>

        {/* Marquee Banner with consistent cream color names */}
        <section className="overflow-hidden bg-[#1c1917] px-6 py-5 text-[#f5f0e8]">
          <div className="marquee-track mx-auto flex w-max items-center gap-12 text-sm font-medium">
            <span className="text-[#c2674a] uppercase tracking-wider font-bold text-xs">Trusted by teams at</span>
            <span>Northstar</span>
            <span>Fallow</span>
            <span>Arc & Co.</span>
            <span>Kindred</span>
            <span>Fieldwork</span>
            <span>Northstar</span>
            <span>Fallow</span>
            <span>Arc & Co.</span>
            <span>Kindred</span>
            <span>Fieldwork</span>
          </div>
        </section>

        {/* Quotes Section */}
        <section className="mx-auto max-w-7xl px-6 py-24">
          <h2 className="mx-auto max-w-2xl text-center font-serif text-4xl sm:text-5xl text-heading">
            Most feedback never gets said.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              'I wanted to tell my manager the deadlines were destroying the team. I said nothing.',
              'Everyone said yes in the meeting. Nobody actually meant it.',
              'The retro had four people talking and eight people silent the entire hour.',
            ].map((quote) => (
              <blockquote key={quote} className="rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-7 font-serif text-lg italic text-muted-foreground leading-relaxed">
                “{quote}”
              </blockquote>
            ))}
          </div>
          <p className="mt-10 text-center font-serif text-3xl sm:text-4xl text-[#c2674a]">
            Openly fixes this.
          </p>
        </section>

        {/* Room Formats Section */}
        <section id="formats" className="bg-[#ede8dc] border-y border-[#ddd5c8] px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f0e8] border border-[#ddd5c8] text-xs font-semibold text-[#c2674a] mb-3">
              <Sparkle size={14} weight="fill" />
              <span>Room formats</span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl text-heading max-w-2xl">
              Spaces designed for every kind of truth.
            </h2>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {/* Highlight Card: 2-way threads */}
              <article className="rounded-2xl border-2 border-[#c2674a]/40 bg-[#f5f0e8] p-8 md:col-span-2 md:row-span-2 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="eyebrow text-[#c2674a]">The killer feature</p>
                  <h3 className="mt-2 font-serif text-3xl text-heading">Two-way anonymous threads</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-md">
                    Ask a clarifying question on a response without ever exposing who wrote it. Safe, respectful, closed-loop dialog.
                  </p>
                </div>

                <div className="mt-8 rounded-2xl bg-[#1c1917] p-6 text-[#f5f0e8] space-y-3">
                  <span className="text-xs uppercase tracking-wider text-[#f5f0e8]/70 font-semibold">Anonymous responder</span>
                  <p className="text-sm">“I think our design handoff needs more breathing room.”</p>
                  <div className="mt-3 ml-auto max-w-[85%] rounded-xl bg-[#c2674a] p-3.5 text-xs text-[#f5f0e8]">
                    “Thank you for saying it. What change would make it easiest next sprint?”
                  </div>
                </div>
              </article>

              {formats.map((f) => (
                <article key={f.type} className="rounded-2xl border border-[#ddd5c8] bg-[#f5f0e8] p-6 transition hover:-translate-y-1 shadow-sm">
                  <div className="mb-3">
                    <RoomTypeBadge type={f.type} />
                  </div>
                  <h3 className="font-serif text-xl font-medium text-heading">{f.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section with proper cards */}
        <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-24">
          <h2 className="text-center font-serif text-4xl sm:text-5xl text-heading">
            Honest feedback in 3 quiet steps.
          </h2>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { num: '01', title: 'Create your room', desc: 'Choose a format, add prompts, and set an optional close date.' },
              { num: '02', title: 'Share the link', desc: 'Send it on Slack, email, or WhatsApp. No respondent account needed.' },
              { num: '03', title: 'Read what they think', desc: 'Explore sentiment depth, trends, and follow up in anonymous threads.' },
            ].map((step) => (
              <article key={step.num} className="relative rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-8 shadow-sm">
                <span className="absolute right-6 top-3 font-serif text-7xl text-[#c2674a]/15 font-bold">
                  {step.num}
                </span>
                <h3 className="relative font-serif text-2xl text-heading">{step.title}</h3>
                <p className="relative mt-3 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Safety Score Section */}
        <section id="safety-score" className="bg-[#1c1917] px-6 py-24 text-[#f5f0e8]">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
            <div className="space-y-4">
              <p className="eyebrow text-[#7c8c5e]">Proprietary Trust Metrics</p>
              <h2 className="font-serif text-4xl sm:text-5xl text-[#f5f0e8]">
                Measuring safety without compromising individuals.
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-[#f5f0e8]/80 max-w-lg">
                Response depth, candid participation, and thread resolution become one useful team signal—never an individual score.
              </p>
            </div>

            <div className="rounded-2xl border border-[#f5f0e8]/20 bg-[#f5f0e8]/5 p-10 text-center">
              <p className="eyebrow text-[#7c8c5e]">Team Safety Index</p>
              <p className="mt-3 font-serif text-8xl text-[#c2674a] font-semibold">84</p>
              <p className="mt-4 font-serif text-xl italic text-[#f5f0e8]">“We finally hear the quietest voices on the team.”</p>
              <p className="mt-2 text-xs text-[#f5f0e8]/60">— Maya, Head of People at Northstar</p>
            </div>
          </div>
        </section>

        {/* Pricing Section - Free and Team cards have #ede8dc background */}
        <section id="pricing" className="mx-auto max-w-5xl px-6 py-24 text-center">
          <h2 className="font-serif text-4xl sm:text-5xl text-heading">Simple pricing. No surprises.</h2>
          <p className="mt-2 text-sm text-muted-foreground">Free forever for small teams. Upgrade as you grow.</p>

          <div className="mt-6 inline-flex rounded-full border border-[#ddd5c8] bg-[#ede8dc] p-1 text-xs">
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-full px-4 py-2 font-semibold transition ${
                !annual ? 'bg-[#1c1917] text-[#f5f0e8]' : 'text-muted-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`rounded-full px-4 py-2 font-semibold transition ${
                annual ? 'bg-[#1c1917] text-[#f5f0e8]' : 'text-muted-foreground'
              }`}
            >
              Annual · save 20%
            </button>
          </div>

          <div className="mt-12 grid gap-6 text-left md:grid-cols-3">
            {[
              { name: 'Free', price: 'Free', sub: '3 rooms · 15 responders each', pro: false },
              { name: 'Pro', price: annual ? '$86/yr' : '$9/mo', sub: 'Unlimited rooms & threads', pro: true },
              { name: 'Team', price: annual ? '$230/yr' : '$24/mo', sub: 'Multiple creators & reports', pro: false },
            ].map((plan) => (
              <article
                key={plan.name}
                className={`rounded-2xl border p-8 flex flex-col justify-between transition ${
                  plan.pro
                    ? 'border-[#c2674a] bg-[#1c1917] text-[#f5f0e8] shadow-xl'
                    : 'border-[#ddd5c8] bg-[#ede8dc] text-heading shadow-sm'
                }`}
              >
                <div>
                  <h3 className="font-serif text-2xl">{plan.name}</h3>
                  <p className="mt-4 font-serif text-4xl font-semibold">{plan.price}</p>
                  <p className="mt-3 text-xs opacity-75">{plan.sub}</p>
                </div>

                <Link
                  href={startHref}
                  className={`mt-8 inline-flex items-center justify-center rounded-full py-3 px-5 text-xs font-semibold transition ${
                    plan.pro
                      ? 'bg-[#c2674a] text-[#f5f0e8] hover:bg-[#ab563b]'
                      : 'bg-[#1c1917] text-[#f5f0e8] hover:bg-[#2c2420]'
                  }`}
                >
                  Choose {plan.name} →
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* CTA Banner with Watermark 0.15 opacity */}
        <section className="relative overflow-hidden bg-[#c2674a] px-6 py-24 text-center text-[#f5f0e8]">
          <p className="absolute inset-x-0 top-6 text-[10rem] font-serif text-[#f5f0e8] opacity-15 pointer-events-none select-none">
            openly.
          </p>
          <div className="relative z-10 max-w-xl mx-auto space-y-4">
            <h2 className="font-serif text-5xl sm:text-6xl text-[#f5f0e8]">
              Your team has things to say.
            </h2>
            <p className="text-base text-[#f5f0e8]/90">
              Give them a safe, calm space to say it.
            </p>
            <div className="pt-4">
              <Link href={startHref} className="inline-flex rounded-full bg-[#1c1917] px-8 py-4 text-sm font-semibold text-[#f5f0e8] hover:bg-[#2c2420] transition shadow-lg">
                Create your first room — it&apos;s free
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#1c1917] px-6 py-12 text-[#f5f0e8]">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-8">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-xs text-[#f5f0e8]/60">
              A slower, kinder room for the thoughts that matter most.
            </p>
          </div>
          <div className="flex gap-8 text-xs font-medium text-[#f5f0e8]/80">
            <a href="#formats" className="hover:text-[#f5f0e8]">Product</a>
            <a href="#how-it-works" className="hover:text-[#f5f0e8]">How it works</a>
            <Link href="/privacy" className="hover:text-[#f5f0e8]">Privacy & Anonymity</Link>
            <Link href="/about" className="hover:text-[#f5f0e8]">About Openly</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
