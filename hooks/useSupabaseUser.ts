'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface UseSupabaseUserResult {
  user: User | null
  loading: boolean
  error: Error | null
}

export function useSupabaseUser(): UseSupabaseUserResult {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const client = createSupabaseBrowserClient()
    let isMounted = true

    const syncUser = async () => {
      setLoading(true)
      try {
        const { data, error } = await client.auth.getUser()
        if (!isMounted) return
        if (error) {
          throw error
        }
        setUser(data.user ?? null)
        setError(null)
      } catch (err) {
        if (!isMounted) return
        setError(err as Error)
        setUser(null)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      setUser(session?.user ?? null)
      setLoading(false)
    })

    void syncUser()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading, error }
}
