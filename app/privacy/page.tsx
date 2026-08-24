import Link from 'next/link'
import { Logo } from '@/components/shared'

export default function PrivacyPage() {
  return <main className="narrow page-content">
    <header className="flex items-center justify-between gap-4"><Link href="/"><Logo /></Link><Link className="text-button" href="/">Back home</Link></header>
    <section className="intro mt-20"><p className="eyebrow text-primary">Privacy & anonymity</p><h1 className="mt-4 font-serif text-6xl leading-none tracking-tight">Your answers are always <em>anonymous.</em></h1><p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">Openly is built for honest participation. Respondents never need an account, and room creators see themes and insights—not identities.</p></section>
    <div className="mt-16 grid gap-5 md:grid-cols-2"><article className="rounded-2xl border border-border bg-card p-7"><h2 className="font-serif text-3xl">No respondent login</h2><p className="mt-3 leading-relaxed text-muted-foreground">People can contribute through a private room link without creating a profile or sharing their name.</p></article><article className="rounded-2xl border border-border bg-card p-7"><h2 className="font-serif text-3xl">No individual scoring</h2><p className="mt-3 leading-relaxed text-muted-foreground">Safety metrics describe the room as a whole. We never rank, label, or expose an individual respondent.</p></article><article className="rounded-2xl border border-border bg-card p-7"><h2 className="font-serif text-3xl">Thoughtful access</h2><p className="mt-3 leading-relaxed text-muted-foreground">Creators control their rooms, while responses remain separated from personal identity by design.</p></article><article className="rounded-2xl border border-border bg-card p-7"><h2 className="font-serif text-3xl">You are in control</h2><p className="mt-3 leading-relaxed text-muted-foreground">If you have a privacy question or need help with a room, reach out and we will help.</p></article></div>
    <p className="mt-16 border-t border-border pt-6 text-sm text-muted-foreground">Openly exists to make room for the thoughts that matter.</p>
  </main>
}
