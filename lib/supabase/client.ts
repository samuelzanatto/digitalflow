import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are not configured.')
}

const createTypedBrowserClient = () => 
  createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

export type SupabaseBrowserClient = ReturnType<typeof createTypedBrowserClient>

let browserClient: SupabaseBrowserClient | null = null

export const createSupabaseBrowserClient = (): SupabaseBrowserClient => {
  if (!browserClient) {
    if (typeof window === 'undefined') {
      throw new Error('createSupabaseBrowserClient must be called in the browser.')
    }
    browserClient = createTypedBrowserClient()
  }
  return browserClient
}
