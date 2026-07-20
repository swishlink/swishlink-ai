-- Run in the Supabase SQL editor.
-- Adds per-category "observed" flags to the videos table — true if the AI
-- actually saw evidence of that skill in the footage, false if it estimated.

alter table public.videos
  add column if not exists rating_3pt_observed       boolean,
  add column if not exists rating_finishing_observed  boolean,
  add column if not exists rating_handles_observed    boolean;
