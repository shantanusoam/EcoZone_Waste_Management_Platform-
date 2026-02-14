-- Create storage bucket for pickup proof photos (driver app)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pickup-photos', 'pickup-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users (drivers) to upload pickup photos
CREATE POLICY "Authenticated users can upload pickup photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pickup-photos');

-- Allow public read for pickup photos (admins may view proof)
CREATE POLICY "Pickup photos are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'pickup-photos');
