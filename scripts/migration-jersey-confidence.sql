-- Run in the Supabase SQL editor.
-- Adds jersey identification + AI confidence columns to the videos table.

alter table public.videos
  add column if not exists jersey_color    text,
  add column if not exists jersey_number   text,
  add column if not exists confidence      text,
  add column if not exists confidence_note text;
