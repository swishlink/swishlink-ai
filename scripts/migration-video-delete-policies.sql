-- Run in the Supabase SQL editor.
-- Enforces server-side (not just client-UI) ownership checks for video
-- deletion: a user can only delete their own videos table row, their own
-- events rows for that video, and their own file in the "videos" storage
-- bucket. Without these policies, DELETE requests are rejected by default
-- once RLS is enabled, or (if RLS were left off) any authenticated user
-- could delete anyone's rows/files.

alter table public.videos enable row level security;
alter table public.events enable row level security;

drop policy if exists "Users can delete their own videos" on public.videos;
create policy "Users can delete their own videos"
  on public.videos for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own events" on public.events;
create policy "Users can delete their own events"
  on public.events for delete
  using (auth.uid() = user_id);

-- Storage objects are matched by filename prefix ("<user_id>-<timestamp>.ext",
-- see the upload path in app/dashboard/page.tsx) rather than the owner
-- column, since that column's name/semantics have varied across Supabase
-- Storage schema versions.
drop policy if exists "Users can delete their own video files" on storage.objects;
create policy "Users can delete their own video files"
  on storage.objects for delete
  using (bucket_id = 'videos' and name like (auth.uid()::text || '-%'));
