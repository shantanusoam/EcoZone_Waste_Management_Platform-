-- Allow anonymous issue reports by making reported_by optional
ALTER TABLE issues ALTER COLUMN reported_by DROP NOT NULL;

-- Create storage bucket for issue photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('issue-photos', 'issue-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public to upload to issue-photos bucket
CREATE POLICY "Anyone can upload issue photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'issue-photos');

-- Allow public to read issue photos
CREATE POLICY "Issue photos are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'issue-photos');

-- Allow public to submit issues (anonymous reporting)
CREATE POLICY "Anyone can report issues"
ON issues FOR INSERT
WITH CHECK (true);

-- Allow reading issues for admins (via RLS or authenticated users)
CREATE POLICY "Authenticated users can read issues"
ON issues FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Allow admins to update issues (mark as resolved)
CREATE POLICY "Authenticated users can update issues"
ON issues FOR UPDATE
USING (auth.uid() IS NOT NULL);
