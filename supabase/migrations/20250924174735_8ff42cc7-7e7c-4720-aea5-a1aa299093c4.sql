-- Creare policy per il bucket legal-docs per permettere upload dalle edge functions
-- Prima assicuriamoci che il bucket esista
INSERT INTO storage.buckets (id, name, public)
VALUES ('legal-docs', 'legal-docs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Creare policy per permettere a tutti di leggere i PDF (bucket pubblico)
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'legal-docs');

-- Creare policy per permettere agli utenti autenticati di uploadare PDF
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'legal-docs' AND 
  auth.role() = 'authenticated'
);

-- Creare policy per permettere agli utenti autenticati di aggiornare i propri PDF
CREATE POLICY "Authenticated users can update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'legal-docs' AND 
  auth.role() = 'authenticated'
);

-- Creare policy per permettere agli utenti autenticati di eliminare i propri PDF
CREATE POLICY "Authenticated users can delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'legal-docs' AND 
  auth.role() = 'authenticated'
);