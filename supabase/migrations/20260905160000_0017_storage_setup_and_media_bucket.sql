/*
# Storage Setup: Media Bucket Creation & Security Policies

1. Purpose:
   - Ensure the `media` storage bucket exists in Supabase Storage with public read access.
   - Set file size limits (50 MB) and allowed MIME types for images (JPEG, PNG, WebP, GIF) and videos (MP4, QuickTime, WebM).
   - Establish storage RLS policies allowing public viewing and authenticated uploads/modifications.
*/

-- =========================================================
-- 1. PROVISION STORAGE BUCKET: media
-- =========================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  52428800, -- 50 MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ]
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/quicktime',
      'video/webm'
    ];

-- =========================================================
-- 2. STORAGE RLS POLICIES
-- =========================================================

-- Public Read: Anyone can view or download assets stored in the media bucket
DROP POLICY IF EXISTS "Public media bucket access" ON storage.objects;
CREATE POLICY "Public media bucket access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

-- Authenticated Insert: Logged-in users can upload files into the media bucket
DROP POLICY IF EXISTS "Authenticated users can upload to media bucket" ON storage.objects;
CREATE POLICY "Authenticated users can upload to media bucket"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media');

-- Authenticated Update: Logged-in users can update files in the media bucket
DROP POLICY IF EXISTS "Authenticated users can update media bucket objects" ON storage.objects;
CREATE POLICY "Authenticated users can update media bucket objects"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'media');

-- Authenticated Delete: Logged-in users can delete files in the media bucket
DROP POLICY IF EXISTS "Authenticated users can delete media bucket objects" ON storage.objects;
CREATE POLICY "Authenticated users can delete media bucket objects"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'media');
