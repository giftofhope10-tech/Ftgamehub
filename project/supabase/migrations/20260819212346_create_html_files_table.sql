CREATE TABLE IF NOT EXISTS html_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Untitled',
  content text NOT NULL DEFAULT '',
  is_favorite boolean NOT NULL DEFAULT false,
  word_count integer NOT NULL DEFAULT 0,
  preview_text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE html_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_html_files" ON html_files;
CREATE POLICY "anon_select_html_files" ON html_files FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_html_files" ON html_files;
CREATE POLICY "anon_insert_html_files" ON html_files FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_html_files" ON html_files;
CREATE POLICY "anon_update_html_files" ON html_files FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_html_files" ON html_files;
CREATE POLICY "anon_delete_html_files" ON html_files FOR DELETE
  TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_html_files_updated_at ON html_files;
CREATE TRIGGER set_html_files_updated_at
  BEFORE UPDATE ON html_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS html_files_updated_at_idx ON html_files (updated_at DESC);
CREATE INDEX IF NOT EXISTS html_files_is_favorite_idx ON html_files (is_favorite) WHERE is_favorite = true;