-- ============================================
-- Supabase Storage Setup for Materials
-- ============================================
-- 
-- URL media disimpan langsung di field 'content' di tabel 'materials' sebagai HTML.
-- Contoh: <img src="https://xxx.supabase.co/storage/v1/object/public/materials/..." />

-- ============================================
-- STEP 1: Buat Storage Bucket (di Supabase Dashboard)
-- ============================================
-- 1. Buka Supabase Dashboard -> Storage
-- 2. Klik "New Bucket"
-- 3. Name: materials
-- 4. ⚠️ PENTING: Centang "Public bucket" agar gambar bisa diakses
-- 5. File size limit: 52428800 (50MB) - opsional

-- ============================================
-- STEP 2: Jalankan Storage Policies di SQL Editor
-- ============================================
-- Policies ini diperlukan agar user bisa upload dan manage files

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'materials');

-- Allow public read access (untuk public bucket)
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'materials');

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'materials' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- TROUBLESHOOTING: Jika policies sudah ada
-- ============================================
-- Jika error "policy already exists", artinya policies sudah dibuat.
-- Tidak perlu melakukan apa-apa lagi.

-- Untuk melihat policies yang ada:
-- SELECT * FROM pg_policies WHERE tablename = 'objects';

-- ============================================
-- PENTING: Jika gambar tidak muncul
-- ============================================
-- 1. Pastikan bucket "materials" sudah PUBLIC
--    Cara cek: Dashboard -> Storage -> materials -> Settings
--    Pastikan "Public bucket" tercentang
--
-- 2. Atau jadikan bucket public dengan SQL:
-- UPDATE storage.buckets SET public = true WHERE id = 'materials';

-- ============================================
-- Selesai! 
-- ============================================
