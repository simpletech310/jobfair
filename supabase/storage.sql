
-- Create Buckets (if they don't exist, this might fail in SQL Editor if already exists, but "insert into" usually needs checks. 
-- Supabase SQL Editor handles "ON CONFLICT DO NOTHING" for buckets if we do it right, but standard SQL insert might error.
-- Best practice: Just insert. If it fails, user can ignore if bucket exists.

insert into storage.buckets (id, name, public) 
values ('resumes', 'resumes', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('videos', 'videos', true)
on conflict (id) do nothing;

-- RLS POLICIES FOR STORAGE

-- Resumes: Authenticated users can upload, view, and delete their OWN files.
-- We'll use a folder structure: `resumes/{user_id}/{filename}`
create policy "Give users access to own folder 1u578k_0" on storage.objects
  for select
  using (
    bucket_id = 'resumes' and 
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Give users access to own folder 1u578k_1" on storage.objects
  for insert
  with check (
    bucket_id = 'resumes' and 
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Give users access to own folder 1u578k_2" on storage.objects
  for update
  using (
    bucket_id = 'resumes' and 
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Give users access to own folder 1u578k_3" on storage.objects
  for delete
  using (
    bucket_id = 'resumes' and 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Videos: Same pattern
create policy "Give users access to own folder 1u578k_4" on storage.objects
  for select
  using (
    bucket_id = 'videos' and 
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Give users access to own folder 1u578k_5" on storage.objects
  for insert
  with check (
    bucket_id = 'videos' and 
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Give users access to own folder 1u578k_6" on storage.objects
  for update
  using (
    bucket_id = 'videos' and 
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Give users access to own folder 1u578k_7" on storage.objects
  for delete
  using (
    bucket_id = 'videos' and 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ALSO: Employers need to READ resumes/videos.
-- We can add a policy for authenticated users to READ ALL resumes/videos?
-- Or rely on public bucket URLs (since we set public=true).
-- If public=true, select policies on objects might still restrict listing?
-- "getPublicUrl" doesn't need RLS for select if bucket is public.
-- But "list" operations do need RLS.
-- So for "Multi-Resume Selection" to work, users MUST be able to SELECT (list) their own folder. The above policies cover that.

-- For Employers to view resumes, if they just use the public URL, they don't need RLS select permission.
-- But if we want to secure it later, we'd adjust public=false and add RLS.
-- For MVP, Public Buckets + Owner RLS is fine.
