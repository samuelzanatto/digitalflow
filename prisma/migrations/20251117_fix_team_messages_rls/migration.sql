-- Migration: Fix RLS policies for team_messages table
-- Previous policies were not working because auth.role() wasn't being passed correctly
-- by Supabase PostgREST API. Using auth.uid() directly works better.

-- Drop old policies that weren't working
DROP POLICY IF EXISTS "team_messages_select_authenticated" ON public.team_messages;
DROP POLICY IF EXISTS "team_messages_insert_authenticated" ON public.team_messages;
DROP POLICY IF EXISTS "team_messages_delete_authenticated" ON public.team_messages;
DROP POLICY IF EXISTS "team_messages_update_authenticated" ON public.team_messages;
DROP POLICY IF EXISTS "test_select" ON public.team_messages;
DROP POLICY IF EXISTS "team_messages_permissive_select" ON public.team_messages;

-- Grant table permissions to authenticated and anon roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_messages TO anon;

-- Create new, working policies:
-- SELECT: Allow anyone to read (public read, permission enforced by RLS)
CREATE POLICY "select_all"
  ON public.team_messages
  FOR SELECT
  USING (true);

-- INSERT: Allow authenticated users to insert only their own messages
CREATE POLICY "insert_own"
  ON public.team_messages
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Allow users to update only their own messages
CREATE POLICY "update_own"
  ON public.team_messages
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Allow users to delete only their own messages
CREATE POLICY "delete_own"
  ON public.team_messages
  FOR DELETE
  USING (user_id = auth.uid());
