import { createBrowserClient } from '@supabase/ssr'

// Placeholders keep prerendering working when env vars are absent (e.g. CI builds).
// Requests only happen in effects, which never run during prerender.
const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_KEY = 'placeholder-key'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || PLACEHOLDER_KEY
  )
}
