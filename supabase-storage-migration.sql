-- ============================================================
-- USM Registration: Supabase Storage for Event Flyers
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Create a public storage bucket for event flyers
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-flyers', 'event-flyers', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow anyone to VIEW flyer images (public)
CREATE POLICY "Public can view flyers"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-flyers');

-- 3. Allow authenticated admins to UPLOAD flyers
CREATE POLICY "Admins can upload flyers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-flyers');

-- 4. Allow authenticated admins to UPDATE (overwrite) flyers
CREATE POLICY "Admins can update flyers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'event-flyers');

-- 5. Allow authenticated admins to DELETE flyers
CREATE POLICY "Admins can delete flyers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'event-flyers');
