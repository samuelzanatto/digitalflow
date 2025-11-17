-- Migration: Enable Realtime for team_messages table
-- This enables Supabase Realtime to stream changes to connected clients

-- Add team_messages table to the supabase_realtime publication
-- This allows clients to subscribe to INSERT, UPDATE, and DELETE events
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;

-- Verify the table is now in the publication
SELECT 
  pt.relname as table_name,
  p.pubname as publication_name
FROM pg_publication p
JOIN pg_publication_rel pr ON p.oid = pr.prpubid
JOIN pg_class pt ON pr.prrelid = pt.oid
WHERE p.pubname = 'supabase_realtime' AND pt.relname = 'team_messages';
